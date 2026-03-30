import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EditorEpisode, EditorMarker } from "@/convex/lib/contracts";
import { formatTimecode, markerTypeLabel } from "./ads-editor-utils";

interface TimelinePanelSlotProps {
  episode: EditorEpisode;
  markers: EditorMarker[];
}

export function TimelinePanelSlot({
  episode,
  markers,
}: TimelinePanelSlotProps) {
  return (
    <Card
      data-slot="timeline-panel"
      className="border-0 ring-1 ring-foreground/10 lg:col-span-2"
    >
      <CardHeader>
        <CardTitle>Timeline baseline</CardTitle>
        <CardDescription>
          Persisted marker coordinates share one time axis and stay normalized
          in Convex.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative h-20 rounded-lg border border-border/60 bg-background/60">
          <div className="absolute inset-x-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />

          {markers.map((marker) => {
            const left = (marker.startMs / episode.durationMs) * 100;

            return (
              <div
                key={marker.id}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `calc(${left}% - 14px)` }}
              >
                <div className="min-w-7 rounded-md border border-border bg-card px-2 py-1 text-[11px] shadow-sm">
                  {formatTimecode(marker.startMs)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {markers.map((marker) => (
            <div
              key={marker.id}
              className="rounded-lg border border-border/60 bg-background/60 p-3"
            >
              <div className="text-sm font-medium">{marker.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {markerTypeLabel(marker.type)} at{" "}
                {formatTimecode(marker.startMs)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
