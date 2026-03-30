export const SKIP_STEP_MS = 10_000;
export const MIN_TIME_MS = 0;

export function clampTimeMs(ms: number, durationMs: number): number {
  return Math.max(MIN_TIME_MS, Math.min(ms, durationMs));
}

export function skipForwardMs(
  currentMs: number,
  durationMs: number,
  stepMs = SKIP_STEP_MS,
): number {
  return clampTimeMs(currentMs + stepMs, durationMs);
}

export function skipBackwardMs(
  currentMs: number,
  durationMs: number,
  stepMs = SKIP_STEP_MS,
): number {
  return clampTimeMs(currentMs - stepMs, durationMs);
}

export function msToSeconds(ms: number): number {
  return ms / 1000;
}

export function secondsToMs(s: number): number {
  return Math.round(s * 1000);
}

export function progressFraction(
  currentMs: number,
  durationMs: number,
): number {
  if (durationMs <= 0) return 0;
  return Math.max(0, Math.min(1, currentMs / durationMs));
}

export function fractionToMs(fraction: number, durationMs: number): number {
  return clampTimeMs(Math.round(fraction * durationMs), durationMs);
}

export function isInteractiveElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "BUTTON"
  ) {
    return true;
  }
  return (
    el.isContentEditable ||
    el.getAttribute("contenteditable") === "true" ||
    el.getAttribute("role") === "searchbox"
  );
}
