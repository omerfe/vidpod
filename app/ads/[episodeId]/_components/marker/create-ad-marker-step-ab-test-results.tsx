"use client";

import { FlaskConical, MoveRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EditorAdAsset, ExperimentSummary } from "@/lib/ads/contracts";
import {
  type RankedVariant,
  rankVariants,
} from "@/lib/ads/experiment-read-model";
import { cn } from "@/lib/utils";
import { formatDuration } from "../ads-editor-utils";

export function CreateAdMarkerStepAbTestResults(props: {
  adLibrary: EditorAdAsset[];
  experimentSummary: ExperimentSummary;
}) {
  const rankedVariants = rankVariants(props.experimentSummary, props.adLibrary);

  return <ExperimentVariantList rankedVariants={rankedVariants} />;
}

export function ExperimentVariantList({
  rankedVariants,
}: {
  rankedVariants: RankedVariant[];
}) {
  return (
    <div className="space-y-3">
      {rankedVariants.map((variant) => (
        <ExperimentVariantRow key={variant.adAssetId} variant={variant} />
      ))}
    </div>
  );
}

function ExperimentVariantRow({ variant }: { variant: RankedVariant }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg p-3 pr-9 transition-colors",
        variant.isWinner
          ? "border-emerald-300 border-3 "
          : "border-border/70 border",
      )}
    >
      <div className="flex aspect-1.1/1 w-28 shrink-0 items-center justify-center rounded-xl">
        {variant.asset?.media.posterUrl ? (
          // biome-ignore lint/performance/noImgElement: This is a valid use case
          <img
            src={variant.asset?.media.posterUrl}
            alt={variant.asset?.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-9 items-center justify-center rounded-full bg-background shadow-xs">
              <FlaskConical className="size-4 text-muted-foreground" />
            </div>
            <span className="px-2 text-[11px] font-medium text-muted-foreground">
              {variant.asset?.folder ?? "Ad variant"}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <h5 className="font-bold text-base">
          {variant.asset?.name ?? variant.label}
        </h5>

        <div className="flex flex-wrap items-center gap-0.5 text-sm text-muted-foreground font-semibold">
          <span>13/03/24 •</span>
          <span>{formatDuration(variant.asset?.durationMs ?? 0)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{variant.asset?.folder ?? "Unsorted"}</Badge>
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
  );
}
