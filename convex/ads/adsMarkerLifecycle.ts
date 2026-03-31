import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { MarkerMutationSummary, MarkerType } from "../lib/contracts";
import {
  assertNoExactStartOverlap,
  normalizeLabel,
  normalizeMarkerStartMs,
  toMarkerSummary,
  validateAssignmentIds,
} from "./adsDomain";
import {
  deleteAssignmentsForMarker,
  deleteExperimentSummary,
  getAssignmentsForMarker,
  insertAssignments,
  requireAdAssets,
  requireEpisodeBySlug,
  upsertExperimentSummary,
} from "./adsPersistence";

export async function createMarker(
  ctx: MutationCtx,
  args: {
    episodeSlug: string;
    markerType: MarkerType;
    startMs: number;
    label?: string;
    notes?: string;
    adAssetIds: Id<"adAssets">[];
  },
): Promise<MarkerMutationSummary> {
  const episode = await requireEpisodeBySlug(ctx, args.episodeSlug);
  const startMs = normalizeMarkerStartMs(args.startMs, episode.durationMs);
  const adAssetIds = validateAssignmentIds(args.markerType, args.adAssetIds);
  await requireAdAssets(ctx, adAssetIds);
  const label = normalizeLabel(args.markerType, args.label);

  const siblings = await ctx.db
    .query("adMarkers")
    .withIndex("by_episodeId_and_startMs", (q) =>
      q.eq("episodeId", episode._id),
    )
    .collect();

  assertNoExactStartOverlap({
    candidateStartMs: startMs,
    existingMarkers: siblings.map((marker) => ({
      id: marker._id,
      startMs: marker.startMs,
    })),
  });

  const markerId = await ctx.db.insert("adMarkers", {
    episodeId: episode._id,
    label,
    markerType: args.markerType,
    startMs,
    notes: args.notes?.trim() || undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  await insertAssignments(ctx, {
    markerId,
    markerType: args.markerType,
    adAssetIds,
  });

  const experimentSummary =
    args.markerType === "ab_test"
      ? await upsertExperimentSummary(ctx, markerId, adAssetIds)
      : null;

  return toMarkerSummary({
    id: markerId,
    label,
    type: args.markerType,
    startMs,
    assignmentCount: adAssetIds.length,
    experimentSummary,
  });
}

export async function updateMarker(
  ctx: MutationCtx,
  args: {
    markerId: Id<"adMarkers">;
    markerType?: MarkerType;
    startMs?: number;
    label?: string;
    notes?: string;
    adAssetIds?: Id<"adAssets">[];
  },
): Promise<MarkerMutationSummary> {
  const marker = await ctx.db.get(args.markerId);

  if (!marker) {
    throw new ConvexError("Marker not found");
  }

  const episode = await ctx.db.get(marker.episodeId);

  if (!episode) {
    throw new ConvexError("Marker episode not found");
  }

  const currentAssignments = await getAssignmentsForMarker(ctx, marker._id);
  const nextType = args.markerType ?? marker.markerType;
  const nextAssetIds = validateAssignmentIds(
    nextType,
    (args.adAssetIds ??
      currentAssignments.map(
        (assignment) => assignment.adAssetId,
      )) as Id<"adAssets">[],
  );

  await requireAdAssets(ctx, nextAssetIds);

  const nextStartMs = normalizeMarkerStartMs(
    args.startMs ?? marker.startMs,
    episode.durationMs,
  );
  const siblings = await ctx.db
    .query("adMarkers")
    .withIndex("by_episodeId_and_startMs", (q) =>
      q.eq("episodeId", episode._id),
    )
    .collect();

  assertNoExactStartOverlap({
    candidateStartMs: nextStartMs,
    existingMarkers: siblings.map((row) => ({
      id: row._id,
      startMs: row.startMs,
    })),
    excludeMarkerId: marker._id,
  });

  const nextLabel = normalizeLabel(nextType, args.label ?? marker.label);
  const nextNotes =
    args.notes === undefined ? marker.notes : args.notes.trim() || undefined;

  await ctx.db.patch("adMarkers", marker._id, {
    markerType: nextType,
    startMs: nextStartMs,
    label: nextLabel,
    notes: nextNotes,
    updatedAt: Date.now(),
  });

  await deleteAssignmentsForMarker(ctx, marker._id);
  await insertAssignments(ctx, {
    markerId: marker._id,
    markerType: nextType,
    adAssetIds: nextAssetIds,
  });

  let experimentSummary = null;

  if (nextType === "ab_test") {
    experimentSummary = await upsertExperimentSummary(
      ctx,
      marker._id,
      nextAssetIds,
    );
  } else {
    await deleteExperimentSummary(ctx, marker._id);
  }

  return toMarkerSummary({
    id: marker._id,
    label: nextLabel,
    type: nextType,
    startMs: nextStartMs,
    assignmentCount: nextAssetIds.length,
    experimentSummary,
  });
}

export async function deleteMarker(
  ctx: MutationCtx,
  args: { markerId: Id<"adMarkers"> },
): Promise<null> {
  const marker = await ctx.db.get(args.markerId);

  if (!marker) {
    throw new ConvexError("Marker not found");
  }

  await deleteAssignmentsForMarker(ctx, marker._id);
  await deleteExperimentSummary(ctx, marker._id);
  await ctx.db.delete("adMarkers", marker._id);

  return null;
}
