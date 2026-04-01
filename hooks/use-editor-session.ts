"use client";

import { useMutation } from "convex/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { EditorMarker, MarkerType } from "@/lib/ads/contracts";
import {
  type EditorCommand,
  type EditorHistoryState,
  EMPTY_HISTORY,
  canRedo as historyCanRedo,
  canUndo as historyCanUndo,
  type MarkerSnapshot,
  popRedo,
  popUndo,
  pushCommand,
  replaceMarkerId,
} from "@/lib/ads/editor-history";

export interface CreateMarkerArgs {
  markerType: MarkerType;
  startMs: number;
  adAssetIds: string[];
}

export interface EditorSession {
  markers: EditorMarker[];
  moveMarker: (markerId: string, newStartMs: number) => Promise<void>;
  deleteMarker: (markerId: string) => Promise<void>;
  createMarker: (args: CreateMarkerArgs) => Promise<void>;
  trackCreation: (markerId: string, snapshot: MarkerSnapshot) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  isProcessing: boolean;
}

export function useEditorSession({
  serverMarkers,
  episodeSlug,
}: {
  serverMarkers: EditorMarker[];
  episodeSlug: string;
}): EditorSession {
  const [history, setHistory] = useState<EditorHistoryState>(EMPTY_HISTORY);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingMoves, setPendingMoves] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const historyRef = useRef(history);
  historyRef.current = history;

  const updateMarkerMut = useMutation(api.ads.updateMarker);
  const deleteMarkerMut = useMutation(api.ads.deleteMarker);
  const createMarkerMut = useMutation(api.ads.createMarker);

  const markers = useMemo(() => {
    return serverMarkers
      .filter((m) => !pendingDeletes.has(m.id))
      .map((m) => {
        const override = pendingMoves.get(m.id);
        if (override !== undefined) {
          return { ...m, startMs: override };
        }
        return m;
      })
      .sort((a, b) => a.startMs - b.startMs);
  }, [serverMarkers, pendingDeletes, pendingMoves]);

  const moveMarker = useCallback(
    async (markerId: string, newStartMs: number) => {
      const marker = serverMarkers.find((m) => m.id === markerId);
      if (!marker) return;

      const previousStartMs = marker.startMs;
      if (previousStartMs === newStartMs) return;

      setPendingMoves((prev) => new Map(prev).set(markerId, newStartMs));

      setHistory((h) =>
        pushCommand(h, {
          kind: "move",
          markerId,
          previousStartMs,
          newStartMs,
        }),
      );

      try {
        await updateMarkerMut({
          markerId: markerId as Id<"adMarkers">,
          startMs: newStartMs,
        });
      } finally {
        setPendingMoves((prev) => {
          const next = new Map(prev);
          next.delete(markerId);
          return next;
        });
      }
    },
    [serverMarkers, updateMarkerMut],
  );

  const deleteMarker = useCallback(
    async (markerId: string) => {
      const marker = serverMarkers.find((m) => m.id === markerId);
      if (!marker) return;

      const snapshot: MarkerSnapshot = {
        episodeSlug,
        markerType: marker.type,
        startMs: marker.startMs,
        label: marker.label,
        notes: marker.notes,
        adAssetIds: marker.assignments.map((a) => a.adAssetId),
      };

      setPendingDeletes((prev) => new Set(prev).add(markerId));

      setHistory((h) => pushCommand(h, { kind: "delete", markerId, snapshot }));

      try {
        await deleteMarkerMut({ markerId: markerId as Id<"adMarkers"> });
      } catch {
        setPendingDeletes((prev) => {
          const next = new Set(prev);
          next.delete(markerId);
          return next;
        });
      }
    },
    [serverMarkers, episodeSlug, deleteMarkerMut],
  );

  const trackCreation = useCallback(
    (markerId: string, snapshot: MarkerSnapshot) => {
      setHistory((h) => pushCommand(h, { kind: "create", markerId, snapshot }));
    },
    [],
  );

  const createMarker = useCallback(
    async (args: CreateMarkerArgs) => {
      const result = await createMarkerMut({
        episodeSlug,
        markerType: args.markerType,
        startMs: args.startMs,
        adAssetIds: args.adAssetIds as Id<"adAssets">[],
      });

      const snapshot: MarkerSnapshot = {
        episodeSlug,
        markerType: args.markerType,
        startMs: args.startMs,
        label: result.label,
        notes: null,
        adAssetIds: args.adAssetIds,
      };

      setHistory((h) =>
        pushCommand(h, { kind: "create", markerId: result.id, snapshot }),
      );
    },
    [episodeSlug, createMarkerMut],
  );

  const executeCommand = useCallback(
    async (command: EditorCommand, direction: "undo" | "redo") => {
      setIsProcessing(true);
      try {
        switch (command.kind) {
          case "move": {
            const targetMs =
              direction === "undo"
                ? command.previousStartMs
                : command.newStartMs;
            setPendingMoves((prev) =>
              new Map(prev).set(command.markerId, targetMs),
            );
            try {
              await updateMarkerMut({
                markerId: command.markerId as Id<"adMarkers">,
                startMs: targetMs,
              });
            } finally {
              setPendingMoves((prev) => {
                const next = new Map(prev);
                next.delete(command.markerId);
                return next;
              });
            }
            break;
          }
          case "delete": {
            if (direction === "undo") {
              const result = await createMarkerMut({
                episodeSlug: command.snapshot.episodeSlug,
                markerType: command.snapshot.markerType,
                startMs: command.snapshot.startMs,
                adAssetIds: command.snapshot.adAssetIds as Id<"adAssets">[],
              });
              setHistory((h) =>
                replaceMarkerId(h, command.markerId, result.id),
              );
            } else {
              setPendingDeletes((prev) => new Set(prev).add(command.markerId));
              try {
                await deleteMarkerMut({
                  markerId: command.markerId as Id<"adMarkers">,
                });
              } catch {
                setPendingDeletes((prev) => {
                  const next = new Set(prev);
                  next.delete(command.markerId);
                  return next;
                });
              }
            }
            break;
          }
          case "create": {
            if (direction === "undo") {
              setPendingDeletes((prev) => new Set(prev).add(command.markerId));
              try {
                await deleteMarkerMut({
                  markerId: command.markerId as Id<"adMarkers">,
                });
              } catch {
                setPendingDeletes((prev) => {
                  const next = new Set(prev);
                  next.delete(command.markerId);
                  return next;
                });
              }
            } else {
              const result = await createMarkerMut({
                episodeSlug: command.snapshot.episodeSlug,
                markerType: command.snapshot.markerType,
                startMs: command.snapshot.startMs,
                adAssetIds: command.snapshot.adAssetIds as Id<"adAssets">[],
              });
              setHistory((h) =>
                replaceMarkerId(h, command.markerId, result.id),
              );
            }
            break;
          }
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [updateMarkerMut, deleteMarkerMut, createMarkerMut],
  );

  const undo = useCallback(async () => {
    const result = popUndo(historyRef.current);
    if (!result) return;
    setHistory(result.next);
    await executeCommand(result.command, "undo");
  }, [executeCommand]);

  const redo = useCallback(async () => {
    const result = popRedo(historyRef.current);
    if (!result) return;
    setHistory(result.next);
    await executeCommand(result.command, "redo");
  }, [executeCommand]);

  return {
    markers,
    moveMarker,
    deleteMarker,
    createMarker,
    trackCreation,
    undo,
    redo,
    canUndo: historyCanUndo(history),
    canRedo: historyCanRedo(history),
    isProcessing,
  };
}
