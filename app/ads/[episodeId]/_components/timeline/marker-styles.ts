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
      return "bg-blue-300/70 dark:bg-blue-800/50";
    case "auto":
      return "bg-emerald-300/70 dark:bg-emerald-800/50";
    case "ab_test":
      return "bg-amber-300/70 dark:bg-amber-800/50";
    default:
      return "bg-muted/50";
  }
}

export function markerBlockBorderClass(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "border-blue-500/60 dark:border-blue-600/40";
    case "auto":
      return "border-emerald-500/60 dark:border-emerald-600/40";
    case "ab_test":
      return "border-amber-500/60 dark:border-amber-600/40";
    default:
      return "border-border";
  }
}

export function markerBadgeClass(type: EditorMarker["type"]): string {
  switch (type) {
    case "static":
      return "bg-blue-600 text-white dark:bg-blue-500";
    case "auto":
      return "bg-emerald-600 text-white dark:bg-emerald-500";
    case "ab_test":
      return "bg-amber-600 text-white dark:bg-amber-500";
    default:
      return "bg-muted text-foreground";
  }
}
