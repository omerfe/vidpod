"use client";

import { GripVertical } from "lucide-react";

interface TimelinePlayheadProps {
  percentLeft: number;
  onScrubStart?: (e: React.PointerEvent) => void;
  onScrubMove?: (e: React.PointerEvent) => void;
  onScrubEnd?: (e: React.PointerEvent) => void;
}

export function TimelinePlayhead({
  percentLeft,
  onScrubStart,
  onScrubMove,
  onScrubEnd,
}: TimelinePlayheadProps) {
  return (
    <div
      className="absolute inset-y-0 z-30 -translate-x-1/2 pointer-events-none"
      style={{ left: `${percentLeft}%` }}
    >
      <div
        className="flex flex-col items-center h-full pointer-events-auto cursor-grab active:cursor-grabbing"
        onPointerDown={onScrubStart}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubEnd}
      >
        <div className="flex w-5 h-5 xl:w-8 xl:h-8 shrink-0 items-center justify-center rounded-md bg-red-500 shadow-sm">
          <GripVertical
            className="size-3 xl:size-4 shrink-0 text-white"
            strokeWidth={2.5}
          />
        </div>
        <div className="flex-1 w-0.5 bg-red-500" />
      </div>
    </div>
  );
}
