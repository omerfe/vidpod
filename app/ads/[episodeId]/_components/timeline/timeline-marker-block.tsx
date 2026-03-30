"use client";

import { GripVertical } from "lucide-react";
import type { EditorMarker } from "@/lib/ads/contracts";
import { msToTimelinePercent } from "@/lib/ads/timeline-math";
import {
  markerBadgeClass,
  markerBlockBgClass,
  markerBlockBorderClass,
  markerTypeShortLabel,
} from "./marker-styles";

interface TimelineMarkerBlockProps {
  marker: EditorMarker;
  durationMs: number;
  vpStartPct: number;
  vpWidthPct: number;
  dragOverrideMs: number | null;
}

export function TimelineMarkerBlock({
  marker,
  durationMs,
  vpStartPct,
  vpWidthPct,
  dragOverrideMs,
}: TimelineMarkerBlockProps) {
  const effectiveStartMs = dragOverrideMs ?? marker.startMs;

  const globalPct = msToTimelinePercent(effectiveStartMs, durationMs);
  const localPct = ((globalPct - vpStartPct) / vpWidthPct) * 100;

  const adDurationMs = marker.assignments[0]?.adAsset.durationMs ?? 5_000;
  const blockWidthPct =
    (((adDurationMs / durationMs) * 100) / vpWidthPct) * 100;

  const posterUrl = marker.assignments[0]?.adAsset.media.posterUrl ?? null;

  if (localPct < -blockWidthPct || localPct > 105) return null;

  const isDragging = dragOverrideMs !== null;

  return (
    <div
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
}
