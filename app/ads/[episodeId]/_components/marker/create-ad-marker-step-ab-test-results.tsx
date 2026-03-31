"use client";

import { DotIcon, FlaskConical, MoveRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EditorAdAsset, ExperimentSummary } from "@/lib/ads/contracts";
import { cn } from "@/lib/utils";
import { formatDuration } from "../ads-editor-utils";

type RankedVariant = {
  adAssetId: string;
  label: string;
  rank: number;
  isWinner: boolean;
  completionRate: number;
  asset: EditorAdAsset | null;
};

function rankVariants(
  summary: ExperimentSummary,
  adLibrary: EditorAdAsset[],
): RankedVariant[] {
  const adLibraryById = new Map(adLibrary.map((asset) => [asset.id, asset]));

  return [...summary.variants]
    .sort((left, right) => {
      if (right.completionRate !== left.completionRate) {
        return right.completionRate - left.completionRate;
      }
      return right.completions - left.completions;
    })
    .map((variant, index) => ({
      adAssetId: variant.adAssetId,
      label: variant.label,
      rank: index + 1,
      isWinner: summary.winningAdAssetId === variant.adAssetId,
      completionRate: variant.completionRate,
      asset: adLibraryById.get(variant.adAssetId) ?? null,
    }));
}

export function CreateAdMarkerStepAbTestResults(props: {
  adLibrary: EditorAdAsset[];
  experimentSummary: ExperimentSummary;
}) {
  const rankedVariants = rankVariants(props.experimentSummary, props.adLibrary);

  return (
    <div className="space-y-3">
      {rankedVariants.map((variant) => (
        <div
          key={variant.adAssetId}
          className={cn(
            "flex items-center gap-4 rounded-2xl border p-3 transition-colors",
            variant.isWinner
              ? "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200"
              : "border-border/70 bg-background",
          )}
        >
          <div className="flex aspect-video w-28 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-9 items-center justify-center rounded-full bg-background shadow-xs">
                <FlaskConical className="size-4 text-muted-foreground" />
              </div>
              <span className="px-2 text-[11px] font-medium text-muted-foreground">
                {variant.asset?.folder ?? "Ad variant"}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <h5 className="font-medium">
              {variant.asset?.name ?? variant.label}
            </h5>

            <div className="flex flex-wrap items-center gap-0.5 text-xs text-muted-foreground">
              <span>{formatDuration(variant.asset?.durationMs ?? 0)}</span>
              <DotIcon className="size-4" />
              <span>{variant.asset?.cta ?? variant.label}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">
                {variant.asset?.folder ?? "Unsorted"}
              </Badge>
              <MoveRightIcon className="size-4" />
              <Badge variant="outline">
                {variant.asset?.campaign ?? "Campaign"}
              </Badge>
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <Badge
              className={cn(
                "rounded-full px-2 py-1 text-xs",
                variant.isWinner
                  ? "border-transparent bg-emerald-200 text-emerald-800"
                  : "border-transparent bg-muted text-foreground",
              )}
            >
              #{variant.rank}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
