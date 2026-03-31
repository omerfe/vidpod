import { PlusIcon, Trash2, WandIcon } from "lucide-react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { pickRandomAdAsset } from "@/lib/ads/ad-selection-service";
import type { EditorAdAsset, EditorMarker } from "@/lib/ads/contracts";
import type { MarkerSnapshot } from "@/lib/ads/editor-history";
import { formatTimecodeHMS, markerTypeLabel } from "../ads-editor-utils";
import { CreateAdMarkerDialog } from "./create-ad-marker-dialog";
import { EditAdMarkerDialog } from "./edit-ad-marker-dialog";
import { ExperimentResultsDialog } from "./experiment-results-dialog";

export function MarkerPanelSlot({
  episodeSlug,
  episodeDurationMs,
  adLibrary,
  markers,
  playbackTimeMs,
  onDeleteMarker,
  onMarkerCreated,
}: {
  episodeSlug: string;
  episodeDurationMs: number;
  adLibrary: EditorAdAsset[];
  markers: EditorMarker[];
  playbackTimeMs: number;
  onDeleteMarker?: (markerId: string) => void;
  onMarkerCreated?: (markerId: string, snapshot: MarkerSnapshot) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editMarker, setEditMarker] = useState<EditorMarker | null>(null);
  const [resultsMarker, setResultsMarker] = useState<EditorMarker | null>(
    null,
  );
  const [isAutoPlacing, setIsAutoPlacing] = useState(false);
  const createMarkerMutation = useMutation(api.ads.createMarker);

  return (
    <Card
      data-slot="marker-panel"
      className="border-border/60 bg-card shadow-sm"
    >
      <CardHeader className="space-y-0 flex items-start justify-between gap-4">
        <CardTitle>Ad markers</CardTitle>
        <div className="text-muted-foreground">
          {markers.length} {markers.length === 1 ? "marker" : "markers"}
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col justify-between">
        {markers.length === 0 ? (
          <div className="flex min-h-52 flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-5 text-center text-sm text-muted-foreground">
            No markers yet. This episode is ready for the first ad insert.
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3 max-h-[70%] overflow-y-auto">
            {markers.map((marker, index) => (
              <MarkerItem
                key={marker.id}
                marker={marker}
                index={index}
                onEdit={
                  marker.type !== "ab_test"
                    ? () => setEditMarker(marker)
                    : undefined
                }
                onDelete={onDeleteMarker}
                onViewResults={
                  marker.type === "ab_test"
                    ? () => setResultsMarker(marker)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => {
              setCreateOpen(true);
            }}
            className="w-full"
            size="lg"
          >
            Create ad marker
            <PlusIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full"
            disabled={isAutoPlacing || adLibrary.length === 0}
            onClick={async () => {
              const adStart = pickRandomAdAsset(adLibrary);
              const adEnd = pickRandomAdAsset(adLibrary);
              if (!adStart || !adEnd) return;

              setIsAutoPlacing(true);
              const startMs = 5_000;
              const endMs = Math.max(0, episodeDurationMs - 5_000);

              try {
                const existingStartTimes = new Set(
                  markers.map((m) => m.startMs),
                );

                if (!existingStartTimes.has(startMs)) {
                  await createMarkerMutation({
                    episodeSlug,
                    markerType: "auto",
                    startMs,
                    adAssetIds: [adStart.id as Id<"adAssets">],
                  });
                }

                if (!existingStartTimes.has(endMs) && endMs !== startMs) {
                  await createMarkerMutation({
                    episodeSlug,
                    markerType: "auto",
                    startMs: endMs,
                    adAssetIds: [adEnd.id as Id<"adAssets">],
                  });
                }
              } finally {
                setIsAutoPlacing(false);
              }
            }}
          >
            {isAutoPlacing ? "Placing…" : "Automatically place"}
            <WandIcon className="size-4" />
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
        onMarkerCreated={onMarkerCreated}
      />
      {editMarker ? (
        <EditAdMarkerDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setEditMarker(null);
          }}
          marker={editMarker}
          episodeDurationMs={episodeDurationMs}
          adLibrary={adLibrary}
          playbackTimeMs={playbackTimeMs}
        />
      ) : null}
      {resultsMarker ? (
        <ExperimentResultsDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setResultsMarker(null);
          }}
          marker={resultsMarker}
          adLibrary={adLibrary}
        />
      ) : null}
    </Card>
  );
}

function MarkerItem({
  marker,
  index,
  onEdit,
  onDelete,
  onViewResults,
}: {
  marker: EditorMarker;
  index: number;
  onEdit?: () => void;
  onDelete?: (markerId: string) => void;
  onViewResults?: () => void;
}) {
  return (
    <div className="bg-background flex items-center gap-2">
      <div className="w-3 text-xs font-medium tabular-nums text-muted-foreground">
        {index + 1}
      </div>
      <div className="flex items-center justify-between border border-border rounded-xl p-3 w-full">
        <span className="text-xs font-medium tabular-nums text-foreground">
          {formatTimecodeHMS(marker.startMs)}
        </span>
        <Badge className={markerTypeBadgeClassName(marker.type)}>
          {markerTypeLabel(marker.type)}
        </Badge>
        <div className="flex items-center gap-2">
          {onViewResults ? (
            <Button
              type="button"
              variant="outline"
              className="font-medium text-foreground"
              onClick={onViewResults}
            >
              Results
            </Button>
          ) : null}
          {onEdit ? (
            <Button
              type="button"
              variant="outline"
              className="font-medium text-foreground"
              onClick={onEdit}
            >
              Edit
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onDelete?.(marker.id)}
            className="size-7 rounded-md border-destructive/20 bg-destructive/10 text-destructive shadow-none hover:bg-destructive/20"
          >
            <Trash2 className="size-3.5" />
            <span className="sr-only">Delete marker</span>
          </Button>
        </div>
      </div>
    </div>
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
