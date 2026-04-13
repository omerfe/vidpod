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
      return "bg-marker-static";
    case "auto":
      return "bg-marker-auto";
    case "ab_test":
      return "bg-marker-ab";
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

export function markerBlockForegroundClass(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "text-marker-static-foreground";
    case "auto":
      return "text-marker-auto-foreground";
    case "ab_test":
      return "text-marker-ab-foreground";
    default:
      return "text-foreground/40";
  }
}
