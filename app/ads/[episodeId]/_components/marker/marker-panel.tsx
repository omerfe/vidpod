import { Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EditorAdAsset, EditorMarker } from "@/lib/ads/contracts";
import { formatTimecodeHMS, markerTypeLabel } from "../ads-editor-utils";
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
      className="border-border/60 bg-card shadow-sm min-h-[40svh]"
    >
      <CardHeader className="space-y-0 px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-semibold tracking-[-0.01em]">
            Ad markers
          </CardTitle>
          <div className="text-xs font-medium text-muted-foreground">
            {markers.length} {markers.length === 1 ? "marker" : "markers"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col px-5 pb-5">
        {markers.length === 0 ? (
          <div className="flex min-h-52 flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-5 text-center text-sm text-muted-foreground">
            No markers yet. This episode is ready for the first ad insert.
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3 max-h-[20svh] overflow-y-auto">
            {markers.map((marker, index) => (
              <div
                key={marker.id}
                className="rounded-xl border border-border/60 bg-background px-4 py-3 shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 text-xs font-medium tabular-nums text-muted-foreground">
                    {index + 1}
                  </div>
                  <span className="rounded-md border border-border/70 bg-muted/30 px-2 py-1 text-xs font-medium tabular-nums text-foreground">
                    {formatTimecodeHMS(marker.startMs)}
                  </span>
                  <Badge className={markerTypeBadgeClassName(marker.type)}>
                    {markerTypeLabel(marker.type)}
                  </Badge>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="text-xs font-medium text-foreground disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled
                      className="size-7 rounded-md border-destructive/20 bg-destructive/10 text-destructive shadow-none disabled:pointer-events-none disabled:opacity-60"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete marker</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
          <Button
            type="button"
            className="h-10 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90"
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            Create ad marker
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            className="h-10 w-full rounded-lg border-border/70 bg-background text-foreground shadow-none disabled:pointer-events-none disabled:opacity-60"
          >
            <Sparkles className="size-4" />
            Automatically place
          </Button>
        </div>
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

function markerTypeBadgeClassName(type: EditorMarker["type"]) {
  switch (type) {
    case "auto":
      return "border-transparent bg-emerald-200 text-emerald-700 hover:bg-emerald-150 dark:bg-emerald-950 dark:text-emerald-400";
    case "static":
      return "border-transparent bg-blue-200 text-blue-700 hover:bg-blue-150 dark:bg-blue-950 dark:text-blue-400";
    case "ab_test":
      return "border-transparent bg-amber-200 text-amber-700 hover:bg-amber-150 dark:bg-amber-950 dark:text-amber-400";
    default:
      return "border-border bg-muted text-foreground";
  }
}
