"use client";

export function CreateAdMarkerStepUnavailable() {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      A/B test markers are not available in this build. Choose Static or Auto to
      continue, or go back to pick another type.
    </p>
  );
}
