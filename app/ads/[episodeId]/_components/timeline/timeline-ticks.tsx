"use client";

import { formatTimecodeHMS } from "../ads-editor-utils";

interface TickMark {
  ms: number;
  percent: number;
}

interface TimelineTicksProps {
  ticks: TickMark[];
  vpStartPct: number;
  vpWidthPct: number;
}

export function TimelineTicks({
  ticks,
  vpStartPct,
  vpWidthPct,
}: TimelineTicksProps) {
  return (
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
  );
}
