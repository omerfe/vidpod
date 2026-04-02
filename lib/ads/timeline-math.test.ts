import { describe, expect, it } from "vitest";
import {
  buildTimelineSegments,
  centeredScrollLeftForPercent,
  clampZoom,
  clientXToFraction,
  episodeTimeToExpandedPct,
  expandedFractionToEpisodeMs,
  generateTickMarks,
  generateWaveformBars,
  MAX_ZOOM,
  MIN_ZOOM,
  msToTimelinePercent,
  viewportStartPercent,
  viewportWidthPercent,
  zoomIn,
  zoomOut,
} from "./timeline-math";

describe("clampZoom", () => {
  it("clamps below MIN_ZOOM", () => {
    expect(clampZoom(0.5)).toBe(MIN_ZOOM);
  });

  it("clamps above MAX_ZOOM", () => {
    expect(clampZoom(15)).toBe(MAX_ZOOM);
  });

  it("passes through values in range", () => {
    expect(clampZoom(3)).toBe(3);
  });
});

describe("zoomIn / zoomOut", () => {
  it("increases zoom", () => {
    expect(zoomIn(1)).toBe(1.5);
  });

  it("decreases zoom", () => {
    expect(zoomOut(2)).toBe(1.5);
  });

  it("does not exceed MAX_ZOOM", () => {
    expect(zoomIn(MAX_ZOOM)).toBe(MAX_ZOOM);
  });

  it("does not go below MIN_ZOOM", () => {
    expect(zoomOut(MIN_ZOOM)).toBe(MIN_ZOOM);
  });
});

describe("viewportWidthPercent", () => {
  it("returns 100 at zoom 1", () => {
    expect(viewportWidthPercent(1)).toBe(100);
  });

  it("returns 50 at zoom 2", () => {
    expect(viewportWidthPercent(2)).toBe(50);
  });
});

describe("viewportStartPercent", () => {
  it("returns 0 at zoom 1", () => {
    expect(viewportStartPercent(30_000, 60_000, 1)).toBe(0);
  });

  it("centers playhead in viewport when possible", () => {
    const result = viewportStartPercent(30_000, 60_000, 2);
    expect(result).toBeCloseTo(25, 1);
  });

  it("clamps at 0 when playhead is near start", () => {
    const result = viewportStartPercent(0, 60_000, 4);
    expect(result).toBe(0);
  });

  it("clamps viewport end at 100 when playhead is near end", () => {
    const result = viewportStartPercent(60_000, 60_000, 4);
    const vpWidth = 100 / 4;
    expect(result).toBeCloseTo(100 - vpWidth, 1);
  });
});

describe("msToTimelinePercent", () => {
  it("returns 0 at time 0", () => {
    expect(msToTimelinePercent(0, 60_000)).toBe(0);
  });

  it("returns 50 at midpoint", () => {
    expect(msToTimelinePercent(30_000, 60_000)).toBe(50);
  });

  it("returns 100 at duration", () => {
    expect(msToTimelinePercent(60_000, 60_000)).toBe(100);
  });

  it("returns 0 for zero duration", () => {
    expect(msToTimelinePercent(5_000, 0)).toBe(0);
  });

  it("clamps below 0", () => {
    expect(msToTimelinePercent(-1_000, 60_000)).toBe(0);
  });
});

describe("clientXToFraction", () => {
  it("returns 0 at left edge", () => {
    const rect = { left: 100, width: 400 } as DOMRect;
    expect(clientXToFraction(100, rect)).toBe(0);
  });

  it("returns 1 at right edge", () => {
    const rect = { left: 100, width: 400 } as DOMRect;
    expect(clientXToFraction(500, rect)).toBe(1);
  });

  it("returns 0.5 at midpoint", () => {
    const rect = { left: 100, width: 400 } as DOMRect;
    expect(clientXToFraction(300, rect)).toBe(0.5);
  });

  it("clamps below 0", () => {
    const rect = { left: 100, width: 400 } as DOMRect;
    expect(clientXToFraction(50, rect)).toBe(0);
  });

  it("clamps above 1", () => {
    const rect = { left: 100, width: 400 } as DOMRect;
    expect(clientXToFraction(600, rect)).toBe(1);
  });
});

describe("centeredScrollLeftForPercent", () => {
  it("centers the requested percentage when possible", () => {
    expect(centeredScrollLeftForPercent(50, 2_000, 500)).toBe(750);
  });

  it("clamps near the start", () => {
    expect(centeredScrollLeftForPercent(5, 2_000, 500)).toBe(0);
  });

  it("clamps near the end", () => {
    expect(centeredScrollLeftForPercent(95, 2_000, 500)).toBe(1_500);
  });

  it("returns 0 when there is nothing to scroll", () => {
    expect(centeredScrollLeftForPercent(50, 500, 500)).toBe(0);
  });
});

describe("expandedFractionToEpisodeMs", () => {
  it("maps an expanded midpoint back to the underlying episode time", () => {
    const { segments } = buildTimelineSegments(4_000, []);

    expect(expandedFractionToEpisodeMs(0.5, segments, 4_000)).toBe(2_000);
  });

  it("collapses ad regions back to the marker start time", () => {
    const { segments } = buildTimelineSegments(10_000, [
      {
        id: "marker-1",
        startMs: 4_000,
        assignments: [{ adAsset: { durationMs: 2_000 } }],
      },
    ]);

    expect(expandedFractionToEpisodeMs(0.5, segments, 10_000)).toBe(4_000);
  });
});

describe("episodeTimeToExpandedPct", () => {
  it("returns the expanded percentage for episode time before an ad break", () => {
    const { segments } = buildTimelineSegments(10_000, [
      {
        id: "marker-1",
        startMs: 4_000,
        assignments: [{ adAsset: { durationMs: 2_000 } }],
      },
    ]);

    expect(episodeTimeToExpandedPct(2_000, segments)).toBeCloseTo(16.67, 1);
  });

  it("includes inserted ad duration for later episode time", () => {
    const { segments } = buildTimelineSegments(10_000, [
      {
        id: "marker-1",
        startMs: 4_000,
        assignments: [{ adAsset: { durationMs: 2_000 } }],
      },
    ]);

    expect(episodeTimeToExpandedPct(5_000, segments)).toBeCloseTo(58.33, 1);
  });
});

describe("generateTickMarks", () => {
  it("returns empty array for zero duration", () => {
    expect(generateTickMarks(0, 1, 0)).toEqual([]);
  });

  it("generates ticks within viewport", () => {
    const ticks = generateTickMarks(60_000, 1, 0);
    expect(ticks.length).toBeGreaterThan(0);
    for (const tick of ticks) {
      expect(tick.ms).toBeGreaterThanOrEqual(0);
      expect(tick.ms).toBeLessThanOrEqual(60_000);
      expect(tick.percent).toBeGreaterThanOrEqual(0);
      expect(tick.percent).toBeLessThanOrEqual(100);
    }
  });

  it("uses finer intervals when zoomed in", () => {
    const ticksZoom1 = generateTickMarks(60_000, 1, 0);
    const ticksZoom4 = generateTickMarks(60_000, 4, 0);
    if (ticksZoom1.length >= 2 && ticksZoom4.length >= 2) {
      const interval1 = ticksZoom1[1]?.ms - ticksZoom1[0]?.ms;
      const interval4 = ticksZoom4[1]?.ms - ticksZoom4[0]?.ms;
      expect(interval4).toBeLessThanOrEqual(interval1);
    }
  });
});

describe("generateWaveformBars", () => {
  it("returns requested number of bars", () => {
    const bars = generateWaveformBars(100);
    expect(bars).toHaveLength(100);
  });

  it("returns values between 0 and 1", () => {
    const bars = generateWaveformBars(50);
    for (const bar of bars) {
      expect(bar).toBeGreaterThan(0);
      expect(bar).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = generateWaveformBars(30, 123);
    const b = generateWaveformBars(30, 123);
    expect(a).toEqual(b);
  });

  it("differs for different seeds", () => {
    const a = generateWaveformBars(30, 1);
    const b = generateWaveformBars(30, 2);
    expect(a).not.toEqual(b);
  });
});
