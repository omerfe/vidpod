"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { AdPreviewPlayback } from "@/hooks/use-ad-preview-playback";
import { useAudioWaveform } from "@/hooks/use-audio-waveform";
import type { PlaybackEngine } from "@/hooks/use-playback-engine";
import type { EditorMarker } from "@/lib/ads/contracts";
import {
  buildTimelineSegments,
  episodeTimeToExpandedPct,
  expandedFractionToEpisodeMs,
  generateTickMarks,
  generateWaveformBars,
  MAX_ZOOM,
  MIN_ZOOM,
  zoomIn,
  zoomOut,
} from "@/lib/ads/timeline-math";
import { TimelineMarkerBlock } from "./timeline-marker-block";
import { TimelinePlayhead } from "./timeline-playhead";
import { TimelineTicks } from "./timeline-ticks";
import { TimelineToolbar } from "./timeline-toolbar";

const WAVEFORM_BAR_COUNT = 300;

interface TimelinePanelSlotProps {
  markers: EditorMarker[];
  engine: PlaybackEngine;
  adPreview?: AdPreviewPlayback;
  videoUrl?: string;
  onMoveMarker?: (markerId: string, newStartMs: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function TimelinePanelSlot({
  markers,
  engine,
  adPreview,
  videoUrl,
  onMoveMarker,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: TimelinePanelSlotProps) {
  const { currentTimeMs, durationMs, seek } = engine;
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isAutoScrollingRef = useRef(false);
  const markerDragRef = useRef<{
    markerId: string;
    initialStartMs: number;
    initialClientX: number;
    initialLeftPct: number;
  } | null>(null);
  const [dragOverride, setDragOverride] = useState<{
    markerId: string;
    ms: number;
    leftPct: number;
  } | null>(null);
  const [scrubPctOverride, setScrubPctOverride] = useState<number | null>(null);

  const { segments, expandedDurationMs } = useMemo(
    () => buildTimelineSegments(durationMs, markers),
    [durationMs, markers],
  );

  const waveformResult = useAudioWaveform(videoUrl, WAVEFORM_BAR_COUNT);
  const waveformBars = useMemo(() => {
    if (waveformResult.status === "ready") return waveformResult.peaks;
    return generateWaveformBars(WAVEFORM_BAR_COUNT);
  }, [waveformResult]);

  const vpStartPctFromScroll = useCallback((): number => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return 0;
    return (el.scrollLeft / el.scrollWidth) * 100;
  }, []);

  const ticks = useMemo(() => {
    const vpStartPct = vpStartPctFromScroll();
    return generateTickMarks(expandedDurationMs, zoom, vpStartPct);
  }, [expandedDurationMs, zoom, vpStartPctFromScroll]);

  const clientXToMs = useCallback(
    (clientX: number): number => {
      const content = contentRef.current;
      if (!content || expandedDurationMs <= 0) return 0;
      const rect = content.getBoundingClientRect();
      const fraction = (clientX - rect.left) / rect.width;
      const clamped = Math.max(0, Math.min(1, fraction));
      return expandedFractionToEpisodeMs(clamped, segments, durationMs);
    },
    [expandedDurationMs, segments, durationMs],
  );

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const ms = clientXToMs(clientX);
      const ceiling = Math.max(durationMs - 1_000, 0);
      seek(Math.max(0, Math.min(ms, ceiling)));
    },
    [clientXToMs, seek, durationMs],
  );

  const handleTrackPointerDown = useCallback(
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
          const adSeg = segments.find(
            (s) => s.type === "ad" && s.markerId === markerId,
          );
          const initialLeftPct = adSeg?.startPct ?? 0;
          markerDragRef.current = {
            markerId,
            initialStartMs: marker.startMs,
            initialClientX: e.clientX,
            initialLeftPct,
          };
          setDragOverride({
            markerId,
            ms: marker.startMs,
            leftPct: initialLeftPct,
          });
          trackRef.current?.setPointerCapture(e.pointerId);
          return;
        }
      }
    },
    [markers, onMoveMarker, segments],
  );

  const handleTrackPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (markerDragRef.current) {
        const content = contentRef.current;
        if (!content) return;
        const contentWidth = content.getBoundingClientRect().width;
        if (contentWidth <= 0) return;
        const deltaPixels = e.clientX - markerDragRef.current.initialClientX;
        const msPerPixel = expandedDurationMs / contentWidth;
        const adjusted = Math.round(
          Math.max(
            0,
            markerDragRef.current.initialStartMs + deltaPixels * msPerPixel,
          ),
        );
        const deltaPct = (deltaPixels / contentWidth) * 100;
        setDragOverride({
          markerId: markerDragRef.current.markerId,
          ms: adjusted,
          leftPct: markerDragRef.current.initialLeftPct + deltaPct,
        });
      }
    },
    [expandedDurationMs],
  );

  const handleTrackPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (markerDragRef.current) {
        const content = contentRef.current;
        const { markerId, initialStartMs, initialClientX } =
          markerDragRef.current;
        markerDragRef.current = null;
        setDragOverride(null);
        if (!content) return;
        const contentWidth = content.getBoundingClientRect().width;
        if (contentWidth <= 0) return;
        const deltaPixels = e.clientX - initialClientX;
        const msPerPixel = expandedDurationMs / contentWidth;
        const adjusted = Math.round(
          Math.max(0, initialStartMs + deltaPixels * msPerPixel),
        );
        if (adjusted !== initialStartMs) {
          onMoveMarker?.(markerId, adjusted);
        }
      }
    },
    [expandedDurationMs, onMoveMarker],
  );

  const clientXToExpandedPct = useCallback((clientX: number): number => {
    const content = contentRef.current;
    if (!content) return 0;
    const rect = content.getBoundingClientRect();
    const fraction = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(100, fraction * 100));
  }, []);

  const handleScrubStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setScrubPctOverride(clientXToExpandedPct(e.clientX));
      seekFromClientX(e.clientX);
    },
    [seekFromClientX, clientXToExpandedPct],
  );

  const handleScrubMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      setScrubPctOverride(clientXToExpandedPct(e.clientX));
      seekFromClientX(e.clientX);
    },
    [seekFromClientX, clientXToExpandedPct],
  );

  const handleScrubEnd = useCallback(() => {
    isDraggingRef.current = false;
    setScrubPctOverride(null);
  }, []);

  const zoomSliderValue = ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;

  const handleZoomSlider = useCallback((values: number[]) => {
    const fraction = (values[0] ?? 0) / 100;
    setZoom(MIN_ZOOM + fraction * (MAX_ZOOM - MIN_ZOOM));
  }, []);

  const playheadPct = useMemo(() => {
    if (scrubPctOverride !== null) return scrubPctOverride;
    if (durationMs <= 0) return 0;

    if (adPreview?.previewState.mode === "ad") {
      const adMarkerId = adPreview.previewState.markerId;
      const adSeg = segments.find(
        (s) => s.type === "ad" && s.markerId === adMarkerId,
      );
      if (adSeg) {
        const fraction =
          adSeg.durationMs > 0 ? adPreview.adProgressMs / adSeg.durationMs : 0;
        return adSeg.startPct + Math.min(fraction, 1) * adSeg.widthPct;
      }
    }

    return episodeTimeToExpandedPct(currentTimeMs, segments);
  }, [scrubPctOverride, durationMs, adPreview, segments, currentTimeMs]);

  const expandedCurrentTimeMs = useMemo(() => {
    return Math.round((playheadPct / 100) * expandedDurationMs);
  }, [playheadPct, expandedDurationMs]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => (e.deltaY < 0 ? zoomIn(z) : zoomOut(z)));
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !engine.isPlaying || zoom <= 1) return;

    isAutoScrollingRef.current = true;
    const pct = episodeTimeToExpandedPct(currentTimeMs, segments);
    const fraction = pct / 100;
    const contentWidth = el.scrollWidth;
    const viewWidth = el.clientWidth;
    const targetScroll = fraction * contentWidth - viewWidth / 2;
    el.scrollLeft = Math.max(
      0,
      Math.min(targetScroll, contentWidth - viewWidth),
    );

    requestAnimationFrame(() => {
      isAutoScrollingRef.current = false;
    });
  }, [currentTimeMs, segments, zoom, engine.isPlaying]);

  return (
    <Card data-slot="timeline-panel" className="lg:col-span-2">
      <CardContent>
        <TimelineToolbar
          currentTimeMs={expandedCurrentTimeMs}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          zoomSliderValue={zoomSliderValue}
          onZoomSlider={handleZoomSlider}
        />

        <div className="relative">
          <div
            ref={scrollRef}
            className="overflow-x-auto overflow-y-clip rounded-lg border border-foreground/10 bg-neutral-950"
          >
            <div
              ref={contentRef}
              className="relative"
              style={{ width: `${zoom * 100}%` }}
            >
              <div
                ref={trackRef}
                className="relative h-40 select-none"
                onPointerDown={handleTrackPointerDown}
                onPointerMove={handleTrackPointerMove}
                onPointerUp={handleTrackPointerUp}
                role="slider"
                aria-label="Timeline scrubber"
                aria-valuemin={0}
                aria-valuemax={durationMs}
                aria-valuenow={currentTimeMs}
                tabIndex={-1}
              >
                {segments.map((seg) => {
                  if (seg.type !== "episode") return null;
                  const barStart = Math.round(
                    (seg.episodeStartMs / durationMs) * waveformBars.length,
                  );
                  const barEnd = Math.round(
                    (seg.episodeEndMs / durationMs) * waveformBars.length,
                  );
                  const segBars = waveformBars.slice(
                    barStart,
                    Math.max(barEnd, barStart + 1),
                  );
                  return (
                    <div
                      key={`episeg-${seg.episodeStartMs}`}
                      className="absolute inset-y-2 bg-fuchsia-300/70 rounded-sm mx-0.5"
                      style={{
                        left: `${seg.startPct}%`,
                        width: `${seg.widthPct}%`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-end gap-px px-0.5">
                        {segBars.map((h) => (
                          <div
                            key={`wb-${seg.episodeStartMs}-${h}`}
                            className="flex-1 bg-fuchsia-100"
                            style={{ height: `${h * 100}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {ticks.map((tick) => (
                  <div
                    key={`grid-${tick.ms}`}
                    className="absolute top-0 z-1 h-full w-px -translate-x-1/2 bg-white/10 pointer-events-none"
                    style={{ left: `${tick.percent}%` }}
                  />
                ))}

                {segments
                  .filter((seg) => seg.type === "ad" && seg.markerId)
                  .map((seg) => {
                    const marker = markers.find((m) => m.id === seg.markerId);
                    if (!marker) return null;

                    const isDragging = dragOverride?.markerId === marker.id;
                    let leftPct = seg.startPct;
                    const widthPct = seg.widthPct;

                    if (isDragging && dragOverride) {
                      leftPct = dragOverride.leftPct;
                    }

                    return (
                      <TimelineMarkerBlock
                        key={marker.id}
                        marker={marker}
                        leftPct={leftPct}
                        widthPct={widthPct}
                        isDragging={isDragging}
                      />
                    );
                  })}
              </div>

              <TimelinePlayhead
                percentLeft={playheadPct}
                onScrubStart={handleScrubStart}
                onScrubMove={handleScrubMove}
                onScrubEnd={handleScrubEnd}
              />
              <TimelineTicks ticks={ticks} durationMs={expandedDurationMs} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
