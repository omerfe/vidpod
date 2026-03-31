import type {
  EditorAdAsset,
  EditorMarker,
  ExperimentSummary,
} from "./contracts";

export type RankedVariant = {
  adAssetId: string;
  label: string;
  rank: number;
  isWinner: boolean;
  impressions: number;
  completions: number;
  completionRate: number;
  asset: EditorAdAsset | null;
};

export type ExperimentResultsView =
  | { status: "no_summary" }
  | { status: "no_variants"; confidenceLabel: string }
  | {
      status: "ready";
      confidenceLabel: string;
      rankedVariants: RankedVariant[];
      winnerLabel: string | null;
    };

export function rankVariants(
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
      impressions: variant.impressions,
      completions: variant.completions,
      completionRate: variant.completionRate,
      asset: adLibraryById.get(variant.adAssetId) ?? null,
    }));
}

export function buildExperimentResultsView(
  marker: EditorMarker,
  adLibrary: EditorAdAsset[],
): ExperimentResultsView {
  if (!marker.experimentSummary) {
    return { status: "no_summary" };
  }

  if (marker.experimentSummary.variants.length === 0) {
    return {
      status: "no_variants",
      confidenceLabel: marker.experimentSummary.confidenceLabel,
    };
  }

  const ranked = rankVariants(marker.experimentSummary, adLibrary);
  const winner = ranked.find((v) => v.isWinner);

  return {
    status: "ready",
    confidenceLabel: marker.experimentSummary.confidenceLabel,
    rankedVariants: ranked,
    winnerLabel: winner?.asset?.name ?? winner?.label ?? null,
  };
}

export function isAbTestMarker(marker: EditorMarker): boolean {
  return marker.type === "ab_test";
}
