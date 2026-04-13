export const MIN_ZOOM = 1;
export const MAX_ZOOM = 10;
export const ZOOM_STEP = 0.5;

export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

export function zoomIn(zoom: number, step = ZOOM_STEP): number {
  return clampZoom(zoom + step);
}

export function zoomOut(zoom: number, step = ZOOM_STEP): number {
  return clampZoom(zoom - step);
}

export function viewportWidthPercent(zoom: number): number {
  return 100 / zoom;
}

export function viewportStartPercent(
  currentMs: number,
  durationMs: number,
  zoom: number,
): number {
  if (durationMs <= 0 || zoom <= 1) return 0;
  const fraction = currentMs / durationMs;
  const vpWidth = 1 / zoom;
  const centered = fraction - vpWidth / 2;
  return Math.max(0, Math.min(1 - vpWidth, centered)) * 100;
}

export function msToTimelinePercent(ms: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return Math.max(0, Math.min(100, (ms / durationMs) * 100));
}

export function clientXToFraction(clientX: number, trackRect: DOMRect): number {
  const raw = (clientX - trackRect.left) / trackRect.width;
  return Math.max(0, Math.min(1, raw));
}

export function centeredScrollLeftForPercent(
  percent: number,
  scrollWidth: number,
  clientWidth: number,
): number {
  if (scrollWidth <= clientWidth || clientWidth <= 0) {
    return 0;
  }

  const clampedPercent = Math.max(0, Math.min(100, percent));
  const targetScroll = (clampedPercent / 100) * scrollWidth - clientWidth / 2;
  const maxScroll = scrollWidth - clientWidth;
  return Math.max(0, Math.min(targetScroll, maxScroll));
}

export type TickMarkType = "major" | "minor";

export interface TickMark {
  ms: number;
  percent: number;
  type: TickMarkType;
}

function getTickConfig(visibleDurationS: number): {
  majorIntervalS: number;
  subdivisions: number;
} {
  if (visibleDurationS <= 5) return { majorIntervalS: 1, subdivisions: 5 };
  if (visibleDurationS <= 15) return { majorIntervalS: 5, subdivisions: 5 };
  if (visibleDurationS <= 30) return { majorIntervalS: 10, subdivisions: 5 };
  if (visibleDurationS <= 60) return { majorIntervalS: 10, subdivisions: 5 };
  if (visibleDurationS <= 120) return { majorIntervalS: 30, subdivisions: 6 };
  if (visibleDurationS <= 600) return { majorIntervalS: 60, subdivisions: 6 };
  return { majorIntervalS: 300, subdivisions: 5 };
}

export function generateTickMarks(
  episodeDurationMs: number,
  segments: TimelineSegment[],
  zoom: number,
  viewportStartPct: number,
): TickMark[] {
  if (episodeDurationMs <= 0) return [];

  const episodeDurationS = episodeDurationMs / 1000;
  const visibleDurationS = episodeDurationS / zoom;
  const { majorIntervalS, subdivisions } = getTickConfig(visibleDurationS);
  const minorIntervalS = majorIntervalS / subdivisions;

  const vpWidthPct = 100 / zoom;
  const vpEndPct = viewportStartPct + vpWidthPct;
  const margin = vpWidthPct * 0.1;

  const ticks: TickMark[] = [];

  for (let s = 0; s * 1000 <= episodeDurationMs; s += minorIntervalS) {
    const ms = Math.round(s * 1000);
    const percent = episodeTimeToExpandedPct(ms, segments);

    if (percent < viewportStartPct - margin || percent > vpEndPct + margin) {
      continue;
    }

    const remainder = s % majorIntervalS;
    const isMajor =
      Math.abs(remainder) < 0.001 ||
      Math.abs(remainder - majorIntervalS) < 0.001;
    ticks.push({
      ms,
      percent,
      type: isMajor ? "major" : "minor",
    });
  }

  return ticks;
}

export type TimelineSegment = {
  type: "episode" | "ad";
  startPct: number;
  widthPct: number;
  durationMs: number;
  episodeStartMs: number;
  episodeEndMs: number;
  markerId: string | null;
};

export function buildTimelineSegments(
  episodeDurationMs: number,
  markers: {
    id: string;
    startMs: number;
    assignments: { adAsset: { durationMs: number } }[];
  }[],
): { segments: TimelineSegment[]; expandedDurationMs: number } {
  if (episodeDurationMs <= 0) return { segments: [], expandedDurationMs: 0 };

  const sorted = [...markers].sort((a, b) => a.startMs - b.startMs);

  let totalAdDurationMs = 0;
  for (const m of sorted) {
    totalAdDurationMs += m.assignments[0]?.adAsset.durationMs ?? 5_000;
  }

  const expandedDurationMs = episodeDurationMs + totalAdDurationMs;
  const segments: TimelineSegment[] = [];
  let episodeCursor = 0;
  let expandedCursor = 0;

  for (const marker of sorted) {
    const episodeSegDuration = marker.startMs - episodeCursor;
    if (episodeSegDuration > 0) {
      segments.push({
        type: "episode",
        startPct: (expandedCursor / expandedDurationMs) * 100,
        widthPct: (episodeSegDuration / expandedDurationMs) * 100,
        durationMs: episodeSegDuration,
        episodeStartMs: episodeCursor,
        episodeEndMs: marker.startMs,
        markerId: null,
      });
      expandedCursor += episodeSegDuration;
    }

    const adDuration = marker.assignments[0]?.adAsset.durationMs ?? 5_000;
    segments.push({
      type: "ad",
      startPct: (expandedCursor / expandedDurationMs) * 100,
      widthPct: (adDuration / expandedDurationMs) * 100,
      durationMs: adDuration,
      episodeStartMs: marker.startMs,
      episodeEndMs: marker.startMs,
      markerId: marker.id,
    });
    expandedCursor += adDuration;
    episodeCursor = marker.startMs;
  }

  const remaining = episodeDurationMs - episodeCursor;
  if (remaining > 0) {
    segments.push({
      type: "episode",
      startPct: (expandedCursor / expandedDurationMs) * 100,
      widthPct: (remaining / expandedDurationMs) * 100,
      durationMs: remaining,
      episodeStartMs: episodeCursor,
      episodeEndMs: episodeDurationMs,
      markerId: null,
    });
  }

  return { segments, expandedDurationMs };
}

export function episodeTimeToExpandedPct(
  timeMs: number,
  segments: TimelineSegment[],
): number {
  for (const seg of segments) {
    if (
      seg.type === "episode" &&
      timeMs >= seg.episodeStartMs &&
      timeMs <= seg.episodeEndMs
    ) {
      const offset = timeMs - seg.episodeStartMs;
      const fraction = seg.durationMs > 0 ? offset / seg.durationMs : 0;
      return seg.startPct + fraction * seg.widthPct;
    }
  }
  return 100;
}

export function expandedFractionToEpisodeMs(
  fraction: number,
  segments: TimelineSegment[],
  episodeDurationMs: number,
): number {
  const pct = fraction * 100;
  for (const seg of segments) {
    const segEndPct = seg.startPct + seg.widthPct;
    if (pct <= segEndPct + 0.001) {
      const segFraction =
        seg.widthPct > 0 ? (pct - seg.startPct) / seg.widthPct : 0;
      if (seg.type === "episode") {
        return Math.round(seg.episodeStartMs + segFraction * seg.durationMs);
      }
      return seg.episodeStartMs;
    }
  }
  return episodeDurationMs;
}

export function generateWaveformBars(count: number, seed = 42): number[] {
  const bars: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 7) % 2147483647;
    const base = 0.15 + (s / 2147483647) * 0.7;
    const envelope = Math.sin((i / count) * Math.PI) * 0.3 + 0.7;
    bars.push(base * envelope);
  }
  return bars;
}
