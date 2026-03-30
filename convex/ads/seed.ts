import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { primaryEpisodeSlug, seedMediaSpecs } from "./adsDomain";
import { insertAssignments, upsertExperimentSummary } from "./adsPersistence";

export const seedMvpData = internalMutation({
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
