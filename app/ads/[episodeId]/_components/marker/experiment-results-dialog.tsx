"use client";

import { FlaskConical } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EditorAdAsset, EditorMarker } from "@/lib/ads/contracts";
import { buildExperimentResultsView } from "@/lib/ads/experiment-read-model";
import { ExperimentVariantList } from "./create-ad-marker-step-ab-test-results";

export function ExperimentResultsDialog({
  open,
  onOpenChange,
  marker,
  adLibrary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marker: EditorMarker;
  adLibrary: EditorAdAsset[];
}) {
  const view = useMemo(
    () => buildExperimentResultsView(marker, adLibrary),
    [marker, adLibrary],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="gap-1 space-y-0 text-left">
          <DialogTitle className="text-lg font-semibold">
            A/B test results
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {view.status === "ready"
              ? `${view.rankedVariants.length} ${view.rankedVariants.length === 1 ? "variant" : "variants"} tested`
              : "Review experiment performance for this marker."}
          </DialogDescription>
        </DialogHeader>

        {view.status === "no_summary" ? (
          <EmptyState message="No experiment data is available for this marker yet." />
        ) : null}

        {view.status === "no_variants" ? (
          <EmptyState message="This experiment has no variant data to display." />
        ) : null}

        {view.status === "ready" ? (
          <div className="space-y-4">
            <ExperimentVariantList rankedVariants={view.rankedVariants} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[11px]">
                {view.confidenceLabel}
              </Badge>
              {view.winnerLabel ? (
                <span>
                  Leading variant: <strong>{view.winnerLabel}</strong>
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <DialogFooter className="border-t-0 bg-popover">
          <Button
            type="button"
            className="flex-1 bg-foreground text-background hover:bg-foreground/90 sm:flex-none"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 px-5 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-background shadow-xs">
        <FlaskConical className="size-4 text-muted-foreground" />
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
