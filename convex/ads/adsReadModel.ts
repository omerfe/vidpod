import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import type {
  EditorAdAsset,
  EditorMarker,
  EpisodeEditorData,
  EpisodeListItem,
  ExperimentSummary,
} from "../lib/contracts";
import { resolveMediaRecord } from "../lib/media";
import { getAssignmentsForMarker, requireMediaRecord } from "./adsPersistence";

export async function listEpisodeItems(
  ctx: QueryCtx,
): Promise<EpisodeListItem[]> {
  const episodes = await ctx.db.query("episodes").take(20);
  const items = await Promise.all(
    episodes.map(async (episode) => {
      const markers = await ctx.db
        .query("adMarkers")
        .withIndex("by_episodeId_and_startMs", (q) =>
          q.eq("episodeId", episode._id),
        )
        .order("asc")
        .take(100);

      return {
        slug: episode.slug,
        title: episode.title,
        episodeNumber: episode.episodeNumber,
        publishedAt: episode.publishedAt,
        durationMs: episode.durationMs,
        markerCount: markers.length,
      };
    }),
  );

  return items.sort((left, right) =>
    left.episodeNumber === right.episodeNumber
      ? left.title.localeCompare(right.title)
      : left.episodeNumber - right.episodeNumber,
  );
}

export async function loadEpisodeEditorData(
  ctx: QueryCtx,
  episodeSlug: string,
): Promise<EpisodeEditorData | null> {
  const episode = await ctx.db
    .query("episodes")
    .withIndex("by_slug", (q) => q.eq("slug", episodeSlug))
    .unique();

  if (!episode) {
    return null;
  }

  const episodeMediaRecord = await requireMediaRecord(
    ctx,
    episode.mediaRecordId,
  );
  const adLibrary = await loadAdLibrary(ctx);
  const adLibraryById = new Map(adLibrary.map((asset) => [asset.id, asset]));
  const markers = await ctx.db
    .query("adMarkers")
    .withIndex("by_episodeId_and_startMs", (q) =>
      q.eq("episodeId", episode._id),
    )
    .order("asc")
    .take(100);

  const hydratedMarkers = await Promise.all(
    markers.map((marker) => hydrateMarker(ctx, marker, adLibraryById)),
  );

  return {
    episode: {
      id: episode._id,
      slug: episode.slug,
      title: episode.title,
      episodeNumber: episode.episodeNumber,
      publishedAt: episode.publishedAt,
      durationMs: episode.durationMs,
      description: episode.description,
      media: resolveMediaRecord(episodeMediaRecord),
    },
    adLibrary,
    markers: hydratedMarkers,
    stats: {
      totalMarkers: hydratedMarkers.length,
      staticMarkers: hydratedMarkers.filter(
        (marker) => marker.type === "static",
      ).length,
      autoMarkers: hydratedMarkers.filter((marker) => marker.type === "auto")
        .length,
      abTestMarkers: hydratedMarkers.filter(
        (marker) => marker.type === "ab_test",
      ).length,
    },
  };
}

async function hydrateMarker(
  ctx: QueryCtx,
  marker: Doc<"adMarkers">,
  adLibraryById: Map<string, EditorAdAsset>,
): Promise<EditorMarker> {
  const assignments = await getAssignmentsForMarker(ctx, marker._id);
  const hydratedAssignments = assignments.map((assignment) => {
    const adAsset = adLibraryById.get(assignment.adAssetId);

    if (!adAsset) {
      throw new ConvexError("Assignment references an unknown ad asset");
    }

    return {
      id: assignment._id,
      adAssetId: assignment.adAssetId,
      role: assignment.role,
      sortOrder: assignment.sortOrder,
      variantKey: assignment.variantKey ?? null,
      variantLabel: assignment.variantLabel ?? null,
      adAsset,
    };
  });

  const summaryDoc = await ctx.db
    .query("experimentSummaries")
    .withIndex("by_markerId", (q) => q.eq("markerId", marker._id))
    .unique();

  let experimentSummary: ExperimentSummary | null = null;

  if (summaryDoc) {
    experimentSummary = {
      id: summaryDoc._id,
      confidenceLabel: summaryDoc.confidenceLabel,
      winningAdAssetId: summaryDoc.winningAdAssetId ?? null,
      updatedAt: summaryDoc.updatedAt,
      variants: summaryDoc.variants.map((variant) => ({
        adAssetId: variant.adAssetId,
        label: variant.label,
        impressions: variant.impressions,
        completions: variant.completions,
        completionRate: variant.completionRate,
      })),
    };
  }

  return {
    id: marker._id,
    label: marker.label,
    type: marker.markerType,
    startMs: marker.startMs,
    notes: marker.notes ?? null,
    assignments: hydratedAssignments,
    experimentSummary,
  };
}

async function loadAdLibrary(ctx: QueryCtx): Promise<EditorAdAsset[]> {
  const adAssets = await ctx.db
    .query("adAssets")
    .withIndex("by_status_and_name", (q) => q.eq("status", "active"))
    .take(100);

  return await Promise.all(
    adAssets.map((adAsset) => hydrateAdAsset(ctx, adAsset)),
  );
}

async function hydrateAdAsset(
  ctx: QueryCtx,
  adAsset: Doc<"adAssets">,
): Promise<EditorAdAsset> {
  const mediaRecord = await requireMediaRecord(ctx, adAsset.mediaRecordId);

  return {
    id: adAsset._id,
    slug: adAsset.slug,
    name: adAsset.name,
    campaign: adAsset.campaign,
    folder: adAsset.folder,
    durationMs: adAsset.durationMs,
    cta: adAsset.cta,
    media: resolveMediaRecord(mediaRecord),
  };
}
