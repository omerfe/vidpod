"use client";

import {
  GripVertical,
  RotateCcwIcon,
  RotateCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type { EditorMarker } from "@/lib/ads/contracts";
import {
  clientXToFraction,
  generateTickMarks,
  generateWaveformBars,
  MAX_ZOOM,
  MIN_ZOOM,
  msToTimelinePercent,
  viewportStartPercent,
  viewportWidthPercent,
  zoomIn,
  zoomOut,
} from "@/lib/ads/timeline-math";
import type { PlaybackEngine } from "../../../../hooks/use-playback-engine";
import { formatTimecodeHMS } from "./ads-editor-utils";

const WAVEFORM_BAR_COUNT = 300;

interface TimelinePanelSlotProps {
  markers: EditorMarker[];
  engine: PlaybackEngine;
  onMoveMarker?: (markerId: string, newStartMs: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function TimelinePanelSlot({
  markers,
  engine,
  onMoveMarker,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: TimelinePanelSlotProps) {
  const { currentTimeMs, durationMs, seek } = engine;
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const markerDragRef = useRef<{
    markerId: string;
    initialStartMs: number;
    offsetMs: number;
  } | null>(null);
  const [dragOverride, setDragOverride] = useState<{
    markerId: string;
    ms: number;
  } | null>(null);

  const vpWidthPct = viewportWidthPercent(zoom);
  const vpStartPct = viewportStartPercent(currentTimeMs, durationMs, zoom);

  const waveformBars = useMemo(
    () => generateWaveformBars(WAVEFORM_BAR_COUNT),
    [],
  );

  const ticks = useMemo(
    () => generateTickMarks(durationMs, zoom, vpStartPct),
    [durationMs, zoom, vpStartPct],
  );

  const clientXToMs = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track || durationMs <= 0) return 0;
      const rect = track.getBoundingClientRect();
      const localFraction = clientXToFraction(clientX, rect);
      const globalFraction =
        vpStartPct / 100 + localFraction * (vpWidthPct / 100);
      const ceiling = Math.max(durationMs - 1_000, 0);
      return Math.max(
        0,
        Math.min(Math.round(globalFraction * durationMs), ceiling),
      );
    },
    [vpStartPct, vpWidthPct, durationMs],
  );

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const ms = clientXToMs(clientX);
      seek(ms);
    },
    [clientXToMs, seek],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const gripEl = (e.target as HTMLElement).closest(
        "[data-drag-handle]",
      ) as HTMLElement | null;

      if (gripEl && onMoveMarker) {
        const markerId = gripEl.dataset.markerId;
        if (!markerId) return;
        const marker = markers.find((m) => m.id === markerId);
        if (marker) {
          e.preventDefault();
          const clickMs = clientXToMs(e.clientX);
          markerDragRef.current = {
            markerId,
            initialStartMs: marker.startMs,
            offsetMs: clickMs - marker.startMs,
          };
          setDragOverride({ markerId, ms: marker.startMs });
          trackRef.current?.setPointerCapture(e.pointerId);
          return;
        }
      }

      isDraggingRef.current = true;
      trackRef.current?.setPointerCapture(e.pointerId);
      seekFromClientX(e.clientX);
    },
    [seekFromClientX, markers, onMoveMarker, clientXToMs],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (markerDragRef.current) {
        const rawMs = clientXToMs(e.clientX);
        const adjusted = Math.max(0, rawMs - markerDragRef.current.offsetMs);
        setDragOverride({
          markerId: markerDragRef.current.markerId,
          ms: adjusted,
        });
        return;
      }
      if (!isDraggingRef.current) return;
      seekFromClientX(e.clientX);
    },
    [clientXToMs, seekFromClientX],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (markerDragRef.current) {
        const rawMs = clientXToMs(e.clientX);
        const adjusted = Math.max(0, rawMs - markerDragRef.current.offsetMs);
        const { markerId, initialStartMs } = markerDragRef.current;
        markerDragRef.current = null;
        setDragOverride(null);
        if (adjusted !== initialStartMs) {
          onMoveMarker?.(markerId, adjusted);
        }
        return;
      }
      isDraggingRef.current = false;
    },
    [clientXToMs, onMoveMarker],
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => (e.deltaY < 0 ? zoomIn(z) : zoomOut(z)));
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const zoomSliderValue = ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;

  const handleZoomSlider = useCallback((values: number[]) => {
    const fraction = (values[0] ?? 0) / 100;
    setZoom(MIN_ZOOM + fraction * (MAX_ZOOM - MIN_ZOOM));
  }, []);

  const playheadPct =
    durationMs > 0
      ? ((msToTimelinePercent(currentTimeMs, durationMs) - vpStartPct) /
          vpWidthPct) *
        100
      : 0;
  const playheadVisible = playheadPct >= 0 && playheadPct <= 100;

  return (
    <Card data-slot="timeline-panel" className="lg:col-span-2">
      <CardContent>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full w-5 h-5"
                disabled={!canUndo}
                onClick={onUndo}
              >
                <RotateCcwIcon className="size-3" />
              </Button>
              <span
                className={
                  canUndo ? "text-foreground" : "text-muted-foreground"
                }
              >
                Undo
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full w-5 h-5"
                disabled={!canRedo}
                onClick={onRedo}
              >
                <RotateCwIcon className="size-3" />
              </Button>
              <span
                className={
                  canRedo ? "text-foreground" : "text-muted-foreground"
                }
              >
                Redo
              </span>
            </div>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium tabular-nums text-foreground">
            {formatTimecodeHMS(currentTimeMs)}
          </div>

          <div className="flex items-center gap-2">
            <ZoomOutIcon className="size-3.5" />
            <Slider
              value={[zoomSliderValue]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleZoomSlider}
              className="w-28 cursor-pointer"
            />
            <ZoomInIcon className="size-3.5" />
          </div>
        </div>

        <div className="relative pt-2.5">
          <div
            ref={trackRef}
            className="relative h-40 cursor-crosshair overflow-hidden rounded-lg border border-foreground/10 bg-fuchsia-200/60 dark:bg-fuchsia-950/40 select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            role="slider"
            aria-label="Timeline scrubber"
            aria-valuemin={0}
            aria-valuemax={durationMs}
            aria-valuenow={currentTimeMs}
            tabIndex={-1}
          >
            <div
              className="absolute inset-0 flex items-end gap-px px-0.5"
              style={{
                transform: `translateX(-${(vpStartPct / vpWidthPct) * 100}%)`,
                width: `${zoom * 100}%`,
              }}
            >
              {waveformBars.map((h, i) => {
                const barKey = `wb-${i}-${Math.round(h * 1000)}`;
                return (
                  <div
                    key={barKey}
                    className="flex-1 bg-fuchsia-400/50 dark:bg-fuchsia-500/30"
                    style={{ height: `${h * 100}%` }}
                  />
                );
              })}
            </div>

            {markers.map((marker) => {
              const effectiveStartMs =
                dragOverride?.markerId === marker.id
                  ? dragOverride.ms
                  : marker.startMs;

              const globalPct = msToTimelinePercent(
                effectiveStartMs,
                durationMs,
              );
              const localPct = ((globalPct - vpStartPct) / vpWidthPct) * 100;

              const adDurationMs =
                marker.assignments[0]?.adAsset.durationMs ?? 5_000;
              const blockWidthPct =
                (((adDurationMs / durationMs) * 100) / vpWidthPct) * 100;

              const posterUrl =
                marker.assignments[0]?.adAsset.media.posterUrl ?? null;

              if (localPct < -blockWidthPct || localPct > 105) return null;

              const isDragging = dragOverride?.markerId === marker.id;

              return (
                <div
                  key={marker.id}
                  className={`absolute top-0 z-10 h-full overflow-hidden border-x transition-shadow ${
                    isDragging ? "ring-2 ring-foreground/30 shadow-lg" : ""
                  } ${markerBlockBorderClass(marker.type)}`}
                  style={{
                    left: `${localPct}%`,
                    width: `${Math.max(blockWidthPct, 2)}%`,
                  }}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 ${markerBlockBgClass(marker.type)}`}
                  />

                  {posterUrl && (
                    <div
                      className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
                      style={{ backgroundImage: `url(${posterUrl})` }}
                      aria-hidden="true"
                    />
                  )}

                  <div className="pointer-events-none relative flex h-full flex-col justify-between p-1">
                    <span
                      className={`w-fit rounded px-1 py-0.5 text-[10px] font-bold leading-none ${markerBadgeClass(marker.type)}`}
                    >
                      {markerTypeShortLabel(marker.type)}
                    </span>
                  </div>

                  <div
                    data-drag-handle
                    data-marker-id={marker.id}
                    className={`absolute bottom-0 left-0 right-0 flex h-7 items-center justify-center ${
                      isDragging ? "cursor-grabbing" : "cursor-grab"
                    }`}
                  >
                    <GripVertical className="size-3.5 text-foreground/40" />
                  </div>
                </div>
              );
            })}
          </div>

          {playheadVisible && (
            <div
              className="absolute z-30 pointer-events-none"
              style={{
                left: `${playheadPct}%`,
                top: 0,
                height: "calc(0.375rem + 10rem)",
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2">
                <div className="flex flex-col items-center">
                  <div className="size-3.5 rounded-full border-2 border-destructive bg-destructive shadow-sm" />
                  <div className="h-[calc(10rem-2px)] w-0.5 bg-destructive" />
                </div>
              </div>
            </div>
          )}

          <div
            className="relative mt-1 h-5 overflow-hidden"
            style={{ marginLeft: 0, marginRight: 0 }}
          >
            {ticks.map((tick) => {
              const localPct = ((tick.percent - vpStartPct) / vpWidthPct) * 100;
              if (localPct < -5 || localPct > 105) return null;
              return (
                <div
                  key={`t-${tick.ms}`}
                  className="absolute top-0"
                  style={{ left: `${localPct}%` }}
                >
                  <span className="-translate-x-1/2 text-[10px] tabular-nums text-muted-foreground">
                    {formatTimecodeHMS(tick.ms)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function markerTypeShortLabel(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "S";
    case "auto":
      return "A";
    case "ab_test":
      return "A/B";
    default:
      return "?";
  }
}

function markerBlockBgClass(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "bg-blue-300/70 dark:bg-blue-800/50";
    case "auto":
      return "bg-emerald-300/70 dark:bg-emerald-800/50";
    case "ab_test":
      return "bg-amber-300/70 dark:bg-amber-800/50";
    default:
      return "bg-muted/50";
  }
}

function markerBlockBorderClass(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "border-blue-500/60 dark:border-blue-600/40";
    case "auto":
      return "border-emerald-500/60 dark:border-emerald-600/40";
    case "ab_test":
      return "border-amber-500/60 dark:border-amber-600/40";
    default:
      return "border-border";
  }
}

function markerBadgeClass(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "bg-blue-600 text-white dark:bg-blue-500";
    case "auto":
      return "bg-emerald-600 text-white dark:bg-emerald-500";
    case "ab_test":
      return "bg-amber-600 text-white dark:bg-amber-500";
    default:
      return "bg-muted text-foreground";
  }
}
