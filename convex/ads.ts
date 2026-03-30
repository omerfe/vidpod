import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import {
  getAssignmentRole,
  getVariantKey,
  getVariantLabel,
  normalizeLabel,
  normalizeMarkerStartMs,
  primaryEpisodeSlug,
  seedMediaSpecs,
  toMarkerSummary,
  validateAssignmentIds,
} from "./lib/adsDomain";
import type {
  EditorAdAsset,
  EditorMarker,
  EpisodeEditorData,
  EpisodeListItem,
  ExperimentSummary,
  MarkerType,
} from "./lib/contracts";
import { resolveMediaRecord } from "./lib/media";
import {
  episodeEditorDataValidator,
  episodeListItemValidator,
  markerMutationSummaryValidator,
  markerTypeValidator,
} from "./lib/validators";

export const listEpisodes = query({
  args: {},
  returns: v.array(episodeListItemValidator),
  handler: async (ctx) => {
    return await listEpisodeItems(ctx);
  },
});

export const getEpisodeEditorData = query({
  args: {
    episodeSlug: v.string(),
  },
  returns: v.union(episodeEditorDataValidator, v.null()),
  handler: async (ctx, args) => {
    return await loadEpisodeEditorData(ctx, args.episodeSlug);
  },
});

export const seedMvpData = mutation({
  args: {},
  returns: v.object({
    seeded: v.boolean(),
    primaryEpisodeSlug: v.string(),
    episodeCount: v.number(),
  }),
  handler: async (ctx) => {
    const existingEpisode = await ctx.db
      .query("episodes")
      .withIndex("by_slug", (q) => q.eq("slug", primaryEpisodeSlug))
      .unique();

    if (existingEpisode) {
      return {
        seeded: false,
        primaryEpisodeSlug,
        episodeCount: 2,
      };
    }

    const episode001MediaId = await ctx.db.insert(
      "mediaRecords",
      seedMediaSpecs.episode001,
    );
    const episode002MediaId = await ctx.db.insert(
      "mediaRecords",
      seedMediaSpecs.episode002,
    );
    const coffeeMediaId = await ctx.db.insert(
      "mediaRecords",
      seedMediaSpecs.coffeeBreak,
    );
    const creatorToolsMediaId = await ctx.db.insert(
      "mediaRecords",
      seedMediaSpecs.creatorTools,
    );
    const studioKitMediaId = await ctx.db.insert(
      "mediaRecords",
      seedMediaSpecs.studioKit,
    );

    const episode001Id = await ctx.db.insert("episodes", {
      slug: "episode-001",
      title: "Creator Workflow Deep Dive",
      episodeNumber: 12,
      publishedAt: "2026-03-20T08:00:00.000Z",
      durationMs: seedMediaSpecs.episode001.durationMs,
      description:
        "A seeded editorial workspace for the ads MVP, using tiny local media with a replaceable resolver seam.",
      mediaRecordId: episode001MediaId,
    });

    const episode002Id = await ctx.db.insert("episodes", {
      slug: "episode-002",
      title: "Scaling a Video Podcast Stack",
      episodeNumber: 13,
      publishedAt: "2026-03-27T08:00:00.000Z",
      durationMs: seedMediaSpecs.episode002.durationMs,
      description:
        "A second episode record to prove the data model supports multiple episodes without nesting editor state.",
      mediaRecordId: episode002MediaId,
    });

    const coffeeAdId = await ctx.db.insert("adAssets", {
      slug: "coffee-break",
      name: "Coffee Break",
      campaign: "Spring Sponsors",
      folder: "Host Reads",
      durationMs: seedMediaSpecs.coffeeBreak.durationMs,
      cta: "Visit coffeebreak.example/vidpod",
      status: "active",
      mediaRecordId: coffeeMediaId,
    });

    const creatorToolsAdId = await ctx.db.insert("adAssets", {
      slug: "creator-tools",
      name: "Creator Tools",
      campaign: "Platform Partners",
      folder: "Mid-roll",
      durationMs: seedMediaSpecs.creatorTools.durationMs,
      cta: "Start a trial at creatortools.example",
      status: "active",
      mediaRecordId: creatorToolsMediaId,
    });

    const studioKitAdId = await ctx.db.insert("adAssets", {
      slug: "studio-kit",
      name: "Studio Kit",
      campaign: "Platform Partners",
      folder: "Mid-roll",
      durationMs: seedMediaSpecs.studioKit.durationMs,
      cta: "Build your setup with studiokit.example",
      status: "active",
      mediaRecordId: studioKitMediaId,
    });

    const now = Date.now();

    const staticMarkerId = await ctx.db.insert("adMarkers", {
      episodeId: episode001Id,
      label: "Cold open sponsor",
      markerType: "static",
      startMs: 2_000,
      notes: "Anchored to a single ad asset.",
      createdAt: now,
      updatedAt: now,
    });

    const autoMarkerId = await ctx.db.insert("adMarkers", {
      episodeId: episode001Id,
      label: "Mid-roll filler",
      markerType: "auto",
      startMs: 8_000,
      notes: "Deterministic candidate pool for preview.",
      createdAt: now,
      updatedAt: now,
    });

    const abTestMarkerId = await ctx.db.insert("adMarkers", {
      episodeId: episode001Id,
      label: "Outro experiment",
      markerType: "ab_test",
      startMs: 14_000,
      notes: "A/B test with lightweight summary data.",
      createdAt: now,
      updatedAt: now,
    });

    const secondaryEpisodeMarkerId = await ctx.db.insert("adMarkers", {
      episodeId: episode002Id,
      label: "Secondary mid-roll",
      markerType: "static",
      startMs: 6_000,
      notes: "Keeps the second episode immediately usable.",
      createdAt: now,
      updatedAt: now,
    });

    await insertAssignments(ctx, {
      markerId: staticMarkerId,
      markerType: "static",
      adAssetIds: [coffeeAdId],
    });
    await insertAssignments(ctx, {
      markerId: autoMarkerId,
      markerType: "auto",
      adAssetIds: [creatorToolsAdId, studioKitAdId],
    });
    await insertAssignments(ctx, {
      markerId: abTestMarkerId,
      markerType: "ab_test",
      adAssetIds: [creatorToolsAdId, studioKitAdId],
    });
    await insertAssignments(ctx, {
      markerId: secondaryEpisodeMarkerId,
      markerType: "static",
      adAssetIds: [creatorToolsAdId],
    });

    await upsertExperimentSummary(ctx, abTestMarkerId, [
      creatorToolsAdId,
      studioKitAdId,
    ]);

    return {
      seeded: true,
      primaryEpisodeSlug,
      episodeCount: 2,
    };
  },
});

export const createMarker = mutation({
  args: {
    episodeSlug: v.string(),
    markerType: markerTypeValidator,
    startMs: v.number(),
    label: v.optional(v.string()),
    notes: v.optional(v.string()),
    adAssetIds: v.array(v.id("adAssets")),
  },
  returns: markerMutationSummaryValidator,
  handler: async (ctx, args) => {
    const episode = await requireEpisodeBySlug(ctx, args.episodeSlug);
    const startMs = normalizeMarkerStartMs(args.startMs, episode.durationMs);
    const adAssetIds = validateAssignmentIds(args.markerType, args.adAssetIds);
    await requireAdAssets(ctx, adAssetIds);

    const markerId = await ctx.db.insert("adMarkers", {
      episodeId: episode._id,
      label: normalizeLabel(args.markerType, args.label),
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

    if (args.markerType === "ab_test") {
      await upsertExperimentSummary(ctx, markerId, adAssetIds);
    }

    return toMarkerSummary({
      id: markerId,
      label: normalizeLabel(args.markerType, args.label),
      type: args.markerType,
      startMs,
      assignmentCount: adAssetIds.length,
    });
  },
});

export const updateMarker = mutation({
  args: {
    markerId: v.id("adMarkers"),
    markerType: v.optional(markerTypeValidator),
    startMs: v.optional(v.number()),
    label: v.optional(v.string()),
    notes: v.optional(v.string()),
    adAssetIds: v.optional(v.array(v.id("adAssets"))),
  },
  returns: markerMutationSummaryValidator,
  handler: async (ctx, args) => {
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

    if (nextType === "ab_test") {
      await upsertExperimentSummary(ctx, marker._id, nextAssetIds);
    } else {
      await deleteExperimentSummary(ctx, marker._id);
    }

    return toMarkerSummary({
      id: marker._id,
      label: nextLabel,
      type: nextType,
      startMs: nextStartMs,
      assignmentCount: nextAssetIds.length,
    });
  },
});

export const deleteMarker = mutation({
  args: {
    markerId: v.id("adMarkers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const marker = await ctx.db.get(args.markerId);

    if (!marker) {
      throw new ConvexError("Marker not found");
    }

    await deleteAssignmentsForMarker(ctx, marker._id);
    await deleteExperimentSummary(ctx, marker._id);
    await ctx.db.delete("adMarkers", marker._id);

    return null;
  },
});

async function listEpisodeItems(ctx: QueryCtx): Promise<EpisodeListItem[]> {
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

async function loadEpisodeEditorData(
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

async function requireEpisodeBySlug(
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

async function requireMediaRecord(
  ctx: QueryCtx | MutationCtx,
  mediaRecordId: Id<"mediaRecords">,
): Promise<Doc<"mediaRecords">> {
  const mediaRecord = await ctx.db.get(mediaRecordId);

  if (!mediaRecord) {
    throw new ConvexError("Media record not found");
  }

  return mediaRecord;
}

async function requireAdAssets(
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

async function getAssignmentsForMarker(
  ctx: QueryCtx | MutationCtx,
  markerId: Id<"adMarkers">,
) {
  return await ctx.db
    .query("markerAssignments")
    .withIndex("by_markerId_and_sortOrder", (q) => q.eq("markerId", markerId))
    .order("asc")
    .take(16);
}

async function deleteAssignmentsForMarker(
  ctx: MutationCtx,
  markerId: Id<"adMarkers">,
) {
  const assignments = await getAssignmentsForMarker(ctx, markerId);

  for (const assignment of assignments) {
    await ctx.db.delete("markerAssignments", assignment._id);
  }
}

async function insertAssignments(
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

async function deleteExperimentSummary(
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

async function upsertExperimentSummary(
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
