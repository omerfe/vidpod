export function normalizeMarkerStartMs(
  rawStartMs: number,
  episodeDurationMs: number,
): number {
  const ceiling = Math.max(episodeDurationMs - 1_000, 0);
  return Math.max(0, Math.min(Math.round(rawStartMs), ceiling));
}
