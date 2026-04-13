"use client";

import { GripVertical } from "lucide-react";
import type { EditorMarker } from "@/lib/ads/contracts";
import { cn } from "@/lib/utils";
import {
  markerBlockBgClass,
  markerBlockBorderClass,
  markerBlockForegroundClass,
  markerTypeShortLabel,
} from "./marker-styles";

interface TimelineMarkerBlockProps {
  marker: EditorMarker;
  leftPct: number;
  widthPct: number;
  isDragging: boolean;
}

export function TimelineMarkerBlock({
  marker,
  leftPct,
  widthPct,
  isDragging,
}: TimelineMarkerBlockProps) {
  const posterUrl = marker.assignments[0]?.adAsset.media.posterUrl ?? null;
  const blockWidthPct = widthPct;

  return (
    <div
      className={`absolute inset-y-0 z-1 overflow-hidden rounded-sm transition-shadow ${
        isDragging ? "ring-2 ring-foreground/30 shadow-lg" : ""
      } ${markerBlockBorderClass(marker.type)}`}
      style={{
        left: `${leftPct}%`,
        width: `${Math.max(blockWidthPct, 1)}%`,
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${markerBlockBgClass(marker.type)}`}
      />

      {posterUrl && (
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-1/2 bg-contain bg-center"
          style={{ backgroundImage: `url(${posterUrl})` }}
          aria-hidden="true"
        />
      )}

      <div className="pointer-events-none relative flex h-full flex-col justify-between items-center p-1">
        <span className="w-fit rounded px-1 py-0.5 text-[10px] font-bold border leading-none border-primary">
          {markerTypeShortLabel(marker.type)}
        </span>
      </div>

      <div
        data-drag-handle
        data-marker-id={marker.id}
        className={`absolute bottom-0 left-0 right-0 z-3 flex h-7 items-center justify-center ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <GripVertical
          className={cn("size-3.5", markerBlockForegroundClass(marker.type))}
        />
      </div>
    </div>
  );
}
