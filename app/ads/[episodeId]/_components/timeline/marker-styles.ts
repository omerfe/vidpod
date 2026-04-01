import type { EditorMarker } from "@/lib/ads/contracts";

export function markerTypeShortLabel(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "S";
    case "auto":
      return "A";
    case "ab_test":
      return "A/B";
    default:
      return "?";
  }
}

export function markerBlockBgClass(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "bg-marker-static/70";
    case "auto":
      return "bg-marker-auto/70";
    case "ab_test":
      return "bg-marker-ab/70";
    default:
      return "bg-muted/50";
  }
}

export function markerBlockBorderClass(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "border-marker-static-accent/60";
    case "auto":
      return "border-marker-auto-accent/60";
    case "ab_test":
      return "border-marker-ab-accent/60";
    default:
      return "border-border";
  }
}

export function markerBadgeClass(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "bg-marker-static-accent text-white";
    case "auto":
      return "bg-marker-auto-accent text-white";
    case "ab_test":
      return "bg-marker-ab-accent text-white";
    default:
      return "bg-muted text-foreground";
  }
}
