"use client";

import { formatTimecodeHMS } from "../ads-editor-utils";

interface TickMark {
  ms: number;
  percent: number;
}

interface TimelineTicksProps {
  ticks: TickMark[];
  durationMs: number;
}

export function TimelineTicks({ ticks, durationMs }: TimelineTicksProps) {
  if (durationMs <= 0) return null;

  return (
    <div className="relative h-6 border-t border-white/10 bg-neutral-900">
      {ticks.map((tick) => (
        <div
          key={`tick-${tick.ms}`}
          className="absolute top-0 -translate-x-1/2 pointer-events-none"
          style={{ left: `${tick.percent}%` }}
        >
          <div className="flex flex-col items-center">
            <div className="h-2 w-px bg-white/30" />
            <span className="text-[10px] tabular-nums text-neutral-400 whitespace-nowrap">
              {formatTimecodeHMS(tick.ms)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
