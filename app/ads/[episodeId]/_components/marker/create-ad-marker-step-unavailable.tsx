"use client";

export function CreateAdMarkerStepUnavailable() {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      Automatic and A/B test markers are not available in this build. Choose
      Static to continue, or go back to pick another type.
    </p>
  );
}
