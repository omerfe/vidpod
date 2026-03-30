import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { MarkerType } from "../lib/contracts";
import { getAssignmentRole, getVariantKey, getVariantLabel } from "./adsDomain";

export async function requireEpisodeBySlug(
  ctx: MutationCtx,
  episodeSlug: string,
): Promise<Doc<"episodes">> {
  const episode = await ctx.db
    .query("episodes")
    .withIndex("by_slug", (q) => q.eq("slug", episodeSlug))
    .unique();

  if (!episode) {
    throw new ConvexError(`Episode "${episodeSlug}" not found`);
  }

  return episode;
}

export async function requireMediaRecord(
  ctx: QueryCtx | MutationCtx,
  mediaRecordId: Id<"mediaRecords">,
): Promise<Doc<"mediaRecords">> {
  const mediaRecord = await ctx.db.get(mediaRecordId);

  if (!mediaRecord) {
    throw new ConvexError("Media record not found");
  }

  return mediaRecord;
}

export async function requireAdAssets(
  ctx: MutationCtx,
  adAssetIds: Id<"adAssets">[],
): Promise<Doc<"adAssets">[]> {
  const adAssets = await Promise.all(
    adAssetIds.map((adAssetId) => ctx.db.get(adAssetId)),
  );

  if (adAssets.some((adAsset) => adAsset === null)) {
    throw new ConvexError("One or more ad assets do not exist");
  }

  return adAssets.filter(
    (adAsset): adAsset is Doc<"adAssets"> => adAsset !== null,
  );
}

export async function getAssignmentsForMarker(
  ctx: QueryCtx | MutationCtx,
  markerId: Id<"adMarkers">,
) {
  return await ctx.db
    .query("markerAssignments")
    .withIndex("by_markerId_and_sortOrder", (q) => q.eq("markerId", markerId))
    .order("asc")
    .take(16);
}

export async function deleteAssignmentsForMarker(
  ctx: MutationCtx,
  markerId: Id<"adMarkers">,
) {
  const assignments = await getAssignmentsForMarker(ctx, markerId);

  for (const assignment of assignments) {
    await ctx.db.delete("markerAssignments", assignment._id);
  }
}

export async function insertAssignments(
  ctx: MutationCtx,
  args: {
    markerId: Id<"adMarkers">;
    markerType: MarkerType;
    adAssetIds: Id<"adAssets">[];
  },
) {
  const role = getAssignmentRole(args.markerType);

  for (const [index, adAssetId] of args.adAssetIds.entries()) {
    await ctx.db.insert("markerAssignments", {
      markerId: args.markerId,
      adAssetId,
      role,
      sortOrder: index,
      variantKey:
        args.markerType === "ab_test" ? getVariantKey(index) : undefined,
      variantLabel:
        args.markerType === "ab_test" ? getVariantLabel(index) : undefined,
    });
  }
}

export async function deleteExperimentSummary(
  ctx: MutationCtx,
  markerId: Id<"adMarkers">,
) {
  const existingSummary = await ctx.db
    .query("experimentSummaries")
    .withIndex("by_markerId", (q) => q.eq("markerId", markerId))
    .unique();

  if (existingSummary) {
    await ctx.db.delete("experimentSummaries", existingSummary._id);
  }
}

export async function upsertExperimentSummary(
  ctx: MutationCtx,
  markerId: Id<"adMarkers">,
  adAssetIds: Id<"adAssets">[],
) {
  await deleteExperimentSummary(ctx, markerId);

  const adAssets = await requireAdAssets(ctx, adAssetIds);
  const variants = adAssets.map((adAsset, index) => {
    const impressions = 120 + index * 30;
    const completions = 74 + index * 18;
    return {
      adAssetId: adAsset._id,
      label: adAsset.name,
      impressions,
      completions,
      completionRate: Number((completions / impressions).toFixed(2)),
    };
  });

  await ctx.db.insert("experimentSummaries", {
    markerId,
    confidenceLabel: "Seeded directional signal",
    winningAdAssetId: variants[0]?.adAssetId,
    updatedAt: Date.now(),
    variants,
  });
}
