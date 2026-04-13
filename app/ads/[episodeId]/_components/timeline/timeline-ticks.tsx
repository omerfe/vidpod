"use client";

import { useMemo } from "react";
import type { TickMark } from "@/lib/ads/timeline-math";
import { formatTimecodeHMS } from "../ads-editor-utils";

interface TimelineTicksProps {
  ticks: TickMark[];
  durationMs: number;
}

export function TimelineTicks({ ticks, durationMs }: TimelineTicksProps) {
  const majorTicks = useMemo(
    () => ticks.filter((t) => t.type === "major"),
    [ticks],
  );

  if (durationMs <= 0) return null;

  return (
    <div className="relative h-8">
      {ticks.map((tick) => (
        <div
          key={`tick-${tick.ms}-${tick.type}`}
          className="absolute top-0 -translate-x-1/2 pointer-events-none"
          style={{ left: `${tick.percent}%` }}
        >
          <div
            className={
              tick.type === "major"
                ? "h-7 w-px bg-muted-foreground/50"
                : "h-2 w-px bg-muted-foreground/30"
            }
          />
        </div>
      ))}

      {majorTicks.map((tick, i) => {
        const prevTick = majorTicks[i - 1];
        if (!prevTick) return null;

        const centerPct = (prevTick.percent + tick.percent) / 2;

        return (
          <span
            key={`label-${tick.ms}`}
            className="absolute top-3 -translate-x-1/2 pointer-events-none text-sm font-semibold tabular-nums text-muted-foreground/70 whitespace-nowrap"
            style={{ left: `${centerPct}%` }}
          >
            {formatTimecodeHMS(tick.ms)}
          </span>
        );
      })}
    </div>
  );
}
