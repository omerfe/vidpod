"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { TimelineMarkerBlock } from "./timeline-marker-block";
import { TimelinePlayhead } from "./timeline-playhead";
import { TimelineTicks } from "./timeline-ticks";
import { TimelineToolbar } from "./timeline-toolbar";

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
        <TimelineToolbar
          currentTimeMs={currentTimeMs}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          zoomSliderValue={zoomSliderValue}
          onZoomSlider={handleZoomSlider}
        />

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

            {markers.map((marker) => (
              <TimelineMarkerBlock
                key={marker.id}
                marker={marker}
                durationMs={durationMs}
                vpStartPct={vpStartPct}
                vpWidthPct={vpWidthPct}
                dragOverrideMs={
                  dragOverride?.markerId === marker.id ? dragOverride.ms : null
                }
              />
            ))}
          </div>

          <TimelinePlayhead
            percentLeft={playheadPct}
            visible={playheadVisible}
          />

          <TimelineTicks
            ticks={ticks}
            vpStartPct={vpStartPct}
            vpWidthPct={vpWidthPct}
          />
        </div>
      </CardContent>
    </Card>
  );
}
