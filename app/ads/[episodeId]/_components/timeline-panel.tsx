"use client";

import {
  GripVertical,
  Redo2,
  RotateCcwIcon,
  RotateCwIcon,
  Search,
  Undo2,
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
import { formatTimecodeHMS } from "./ads-editor-utils";
import type { PlaybackEngine } from "./use-playback-engine";

const WAVEFORM_BAR_COUNT = 300;

interface TimelinePanelSlotProps {
  markers: EditorMarker[];
  engine: PlaybackEngine;
}

export function TimelinePanelSlot({ markers, engine }: TimelinePanelSlotProps) {
  const { currentTimeMs, durationMs, seek } = engine;
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

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

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const localFraction = clientXToFraction(clientX, rect);
      const globalFraction =
        vpStartPct / 100 + localFraction * (vpWidthPct / 100);
      const ms = Math.round(globalFraction * durationMs);
      seek(ms);
    },
    [vpStartPct, vpWidthPct, durationMs, seek],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDraggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

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
              >
                <RotateCcwIcon className="size-3" />
              </Button>
              Undo
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full w-5 h-5"
              >
                <RotateCwIcon className="size-3" />
              </Button>
              Redo
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

        <div className="relative">
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
              const globalPct = msToTimelinePercent(marker.startMs, durationMs);
              const localPct = ((globalPct - vpStartPct) / vpWidthPct) * 100;

              const adDurationMs =
                marker.assignments[0]?.adAsset.durationMs ?? 5_000;
              const blockWidthPct =
                (((adDurationMs / durationMs) * 100) / vpWidthPct) * 100;

              const posterUrl =
                marker.assignments[0]?.adAsset.media.posterUrl ?? null;

              if (localPct < -blockWidthPct || localPct > 105) return null;

              return (
                <div
                  key={marker.id}
                  className={`absolute top-0 z-10 h-full overflow-hidden border-x ${markerBlockBorderClass(marker.type)}`}
                  style={{
                    left: `${localPct}%`,
                    width: `${Math.max(blockWidthPct, 2)}%`,
                  }}
                >
                  <div
                    className={`absolute inset-0 ${markerBlockBgClass(marker.type)}`}
                  />

                  {posterUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
                      style={{ backgroundImage: `url(${posterUrl})` }}
                      aria-hidden="true"
                    />
                  )}

                  <div className="relative flex h-full flex-col justify-between p-1">
                    <span
                      className={`w-fit rounded px-1 py-0.5 text-[10px] font-bold leading-none ${markerBadgeClass(marker.type)}`}
                    >
                      {markerTypeShortLabel(marker.type)}
                    </span>
                    <GripVertical className="size-3.5 self-center text-foreground/40" />
                  </div>
                </div>
              );
            })}

            {playheadVisible && (
              <div
                className="absolute top-0 z-20 h-full"
                style={{ left: `${playheadPct}%` }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                  <div className="flex flex-col items-center">
                    <div className="size-3 rounded-full border-2 border-destructive bg-destructive" />
                    <div className="h-[calc(10rem-12px)] w-0.5 bg-destructive" />
                  </div>
                </div>
              </div>
            )}
          </div>

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
      return "bg-rose-300/70 dark:bg-rose-800/50";
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
      return "border-rose-500/60 dark:border-rose-600/40";
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
      return "bg-rose-600 text-white dark:bg-rose-500";
    case "auto":
      return "bg-emerald-600 text-white dark:bg-emerald-500";
    case "ab_test":
      return "bg-amber-600 text-white dark:bg-amber-500";
    default:
      return "bg-muted text-foreground";
  }
}
