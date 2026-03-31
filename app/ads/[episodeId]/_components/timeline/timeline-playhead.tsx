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
      className="absolute inset-y-0 z-30"
      style={{ left: `${percentLeft}%` }}
    >
      <div
        className="absolute inset-0 left-1/2 -translate-x-1/2 flex flex-col items-center  cursor-grab active:cursor-grabbing"
        onPointerDown={onScrubStart}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubEnd}
      >
        <div className="flex w-5 h-5 shrink-0 items-center justify-center rounded-md bg-destructive shadow-sm">
          <GripVertical
            className="size-3 shrink-0 text-white"
            strokeWidth={2.5}
          />
        </div>
        <div className="h-full w-0.5 bg-destructive" />
      </div>
    </div>
  );
}
