import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EditorAdAsset, EditorMarker } from "@/lib/ads/contracts";
import { formatTimecode, markerTypeLabel } from "./ads-editor-utils";
import { CreateAdMarkerDialog } from "./create-ad-marker-dialog";

export function MarkerPanelSlot({
  episodeSlug,
  episodeDurationMs,
  adLibrary,
  markers,
  playbackTimeMs,
}: {
  episodeSlug: string;
  episodeDurationMs: number;
  adLibrary: EditorAdAsset[];
  markers: EditorMarker[];
  playbackTimeMs: number;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Card
      data-slot="marker-panel"
      className="min-h-[40svh] border-0 ring-1 ring-foreground/10"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Ad markers</CardTitle>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            Create ad marker
          </Button>
          <div className="text-sm text-muted-foreground">
            {markers.length} {markers.length === 1 ? "marker" : "markers"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {markers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
            No markers yet. This episode is ready for the first ad insert.
          </div>
        ) : null}

        {markers.map((marker) => (
          <div
            key={marker.id}
            className="rounded-lg border border-border/60 bg-background/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-medium">{marker.label}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTimecode(marker.startMs)}
                </div>
              </div>

              <Badge variant="outline">{markerTypeLabel(marker.type)}</Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {marker.assignments.map((assignment) => (
                <Badge key={assignment.id} variant="secondary">
                  {assignment.variantKey
                    ? `${assignment.variantKey}: ${assignment.adAsset.name}`
                    : assignment.adAsset.name}
                </Badge>
              ))}
            </div>

            {marker.experimentSummary ? (
              <div className="mt-3 text-xs text-muted-foreground">
                {marker.experimentSummary.confidenceLabel}
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
      <CreateAdMarkerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        episodeSlug={episodeSlug}
        episodeDurationMs={episodeDurationMs}
        adLibrary={adLibrary}
        playbackTimeMs={playbackTimeMs}
      />
    </Card>
  );
}
