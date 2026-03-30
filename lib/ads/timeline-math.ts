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

export function clientXToFraction(
  clientX: number,
  trackRect: DOMRect,
): number {
  const raw = (clientX - trackRect.left) / trackRect.width;
  return Math.max(0, Math.min(1, raw));
}

export function generateTickMarks(
  durationMs: number,
  zoom: number,
  viewportStartPct: number,
): { ms: number; percent: number }[] {
  if (durationMs <= 0) return [];

  const durationS = durationMs / 1000;
  const visibleDurationS = durationS / zoom;

  let intervalS: number;
  if (visibleDurationS <= 10) intervalS = 1;
  else if (visibleDurationS <= 30) intervalS = 5;
  else if (visibleDurationS <= 120) intervalS = 10;
  else if (visibleDurationS <= 600) intervalS = 30;
  else intervalS = 60;

  const vpStartMs = (viewportStartPct / 100) * durationMs;
  const vpEndMs = vpStartMs + (durationMs / zoom);

  const startTick = Math.ceil((vpStartMs / 1000) / intervalS) * intervalS;
  const ticks: { ms: number; percent: number }[] = [];

  for (let s = startTick; s * 1000 <= vpEndMs && s * 1000 <= durationMs; s += intervalS) {
    ticks.push({
      ms: s * 1000,
      percent: msToTimelinePercent(s * 1000, durationMs),
    });
  }

  return ticks;
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
