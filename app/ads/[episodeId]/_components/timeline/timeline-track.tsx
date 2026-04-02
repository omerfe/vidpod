import type { EditorMarker } from "@/lib/ads/contracts";
import type { TimelineSegment } from "@/lib/ads/timeline-math";
import { TimelineMarkerBlock } from "./timeline-marker-block";
import type { TimelineDragOverride } from "./use-timeline-marker-drag";

interface TimelineTrackProps {
  currentTimeMs: number;
  dragOverride: TimelineDragOverride | null;
  durationMs: number;
  markers: EditorMarker[];
  segments: TimelineSegment[];
  ticks: { ms: number; percent: number }[];
  trackRef: React.RefObject<HTMLDivElement | null>;
  waveformBars: number[];
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
}

export function TimelineTrack({
  currentTimeMs,
  dragOverride,
  durationMs,
  markers,
  segments,
  ticks,
  trackRef,
  waveformBars,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: TimelineTrackProps) {
  return (
    <div
      ref={trackRef}
      className="relative h-40 select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="slider"
      aria-label="Timeline scrubber"
      aria-valuemin={0}
      aria-valuemax={durationMs}
      aria-valuenow={currentTimeMs}
      tabIndex={-1}
    >
      {segments.map((segment) => {
        if (segment.type !== "episode") {
          return null;
        }

        const barStart = Math.round(
          (segment.episodeStartMs / durationMs) * waveformBars.length,
        );
        const barEnd = Math.round(
          (segment.episodeEndMs / durationMs) * waveformBars.length,
        );
        const segmentBars = waveformBars.slice(
          barStart,
          Math.max(barEnd, barStart + 1),
        );

        return (
          <div
            key={`episeg-${segment.episodeStartMs}`}
            className="absolute inset-y-2 mx-0.5 rounded-sm bg-fuchsia-300"
            style={{
              left: `${segment.startPct}%`,
              width: `${segment.widthPct}%`,
            }}
          >
            <div className="absolute inset-0 flex items-end gap-px px-0.5">
              {segmentBars.map((height, index) => (
                <div
                  key={`wb-${segment.episodeStartMs}-${index}`}
                  className="flex-1 bg-white"
                  style={{ height: `${height * 100}%` }}
                />
              ))}
            </div>
          </div>
        );
      })}

      {ticks.map((tick) => (
        <div
          key={`grid-${tick.ms}`}
          className="pointer-events-none absolute top-0 z-1 h-full w-px -translate-x-1/2 bg-white/10"
          style={{ left: `${tick.percent}%` }}
        />
      ))}

      {segments
        .filter((segment) => segment.type === "ad" && segment.markerId)
        .map((segment) => {
          const marker = markers.find(
            (candidate) => candidate.id === segment.markerId,
          );
          if (!marker) {
            return null;
          }

          const isDragging = dragOverride?.markerId === marker.id;
          const leftPct = isDragging
            ? (dragOverride?.leftPct ?? segment.startPct)
            : segment.startPct;

          return (
            <TimelineMarkerBlock
              key={marker.id}
              marker={marker}
              leftPct={leftPct}
              widthPct={segment.widthPct}
              isDragging={isDragging}
            />
          );
        })}
    </div>
  );
}
