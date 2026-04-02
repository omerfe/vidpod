"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { AdPreviewPlayback } from "@/hooks/use-ad-preview-playback";
import { useAudioWaveform } from "@/hooks/use-audio-waveform";
import type { PlaybackEngine } from "@/hooks/use-playback-engine";
import type { EditorMarker } from "@/lib/ads/contracts";
import {
  buildTimelineSegments,
  centeredScrollLeftForPercent,
  clientXToFraction,
  episodeTimeToExpandedPct,
  expandedFractionToEpisodeMs,
  generateTickMarks,
  generateWaveformBars,
} from "@/lib/ads/timeline-math";
import { TimelinePlayhead } from "./timeline-playhead";
import { TimelineTicks } from "./timeline-ticks";
import { TimelineToolbar } from "./timeline-toolbar";
import { TimelineTrack } from "./timeline-track";
import { useTimelineMarkerDrag } from "./use-timeline-marker-drag";
import { useTimelineScrub } from "./use-timeline-scrub";
import { useTimelineZoom } from "./use-timeline-zoom";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const { segments, expandedDurationMs } = useMemo(
    () => buildTimelineSegments(durationMs, markers),
    [durationMs, markers],
  );

  const waveformResult = useAudioWaveform(videoUrl, WAVEFORM_BAR_COUNT);
  const waveformBars = useMemo(() => {
    if (waveformResult.status === "ready") return waveformResult.peaks;
    return generateWaveformBars(WAVEFORM_BAR_COUNT);
  }, [waveformResult]);

  const clientXToMs = useCallback(
    (clientX: number): number => {
      const content = contentRef.current;
      if (!content || expandedDurationMs <= 0) {
        return 0;
      }

      const rect = content.getBoundingClientRect();
      return expandedFractionToEpisodeMs(
        clientXToFraction(clientX, rect),
        segments,
        durationMs,
      );
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

  const {
    clientXToExpandedPct,
    playheadPct,
    expandedCurrentTimeMs,
    handleScrubStart,
    handleScrubMove,
    handleScrubEnd,
  } = useTimelineScrub({
    contentRef,
    currentTimeMs,
    durationMs,
    expandedDurationMs,
    segments,
    adPreview,
    seekFromClientX,
  });

  const { zoom, zoomSliderValue, handleZoomSlider } = useTimelineZoom({
    scrollRef,
    clientXToExpandedPct,
    playheadPct,
  });

  const {
    dragOverride,
    handleTrackPointerDown,
    handleTrackPointerMove,
    handleTrackPointerUp,
  } = useTimelineMarkerDrag({
    contentRef,
    trackRef,
    expandedDurationMs,
    markers,
    onMoveMarker,
    seekFromClientX,
    segments,
  });

  const ticks = useMemo(() => {
    const element = scrollRef.current;
    const viewportStartPct =
      !element || element.scrollWidth <= element.clientWidth
        ? 0
        : (element.scrollLeft / element.scrollWidth) * 100;

    return generateTickMarks(expandedDurationMs, zoom, viewportStartPct);
  }, [expandedDurationMs, zoom]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !engine.isPlaying || zoom <= 1) {
      return;
    }

    const playheadPercent = episodeTimeToExpandedPct(currentTimeMs, segments);
    element.scrollLeft = centeredScrollLeftForPercent(
      playheadPercent,
      element.scrollWidth,
      element.clientWidth,
    );
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
              <TimelineTrack
                currentTimeMs={currentTimeMs}
                dragOverride={dragOverride}
                durationMs={durationMs}
                markers={markers}
                segments={segments}
                ticks={ticks}
                trackRef={trackRef}
                waveformBars={waveformBars}
                onPointerDown={handleTrackPointerDown}
                onPointerMove={handleTrackPointerMove}
                onPointerUp={handleTrackPointerUp}
              />

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
