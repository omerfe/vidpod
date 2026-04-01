import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createAdAssetFromUpload = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    campaign: v.string(),
    durationMs: v.number(),
  },
  returns: v.id("adAssets"),
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Uploaded file not found in storage");
    }

    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const mediaRecordId = await ctx.db.insert("mediaRecords", {
      label: args.name,
      kind: "ad_video",
      sourceType: "public",
      publicPath: url,
      mimeType: "video/mp4",
      durationMs: args.durationMs,
    });

    return await ctx.db.insert("adAssets", {
      slug: `${slug}-${Date.now()}`,
      name: args.name,
      campaign: args.campaign,
      folder: "Uploads",
      durationMs: args.durationMs,
      cta: "",
      status: "active",
      mediaRecordId,
    });
  },
});

export const createEpisodeFromUpload = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.string(),
    durationMs: v.number(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Uploaded file not found in storage");
    }

    const slug = args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existingEpisodes = await ctx.db.query("episodes").take(100);
    const maxEpisodeNumber = existingEpisodes.reduce(
      (max, ep) => Math.max(max, ep.episodeNumber),
      0,
    );

    const mediaRecordId = await ctx.db.insert("mediaRecords", {
      label: args.title,
      kind: "episode_video",
      sourceType: "public",
      publicPath: url,
      mimeType: "video/mp4",
      durationMs: args.durationMs,
    });

    const uniqueSlug = `${slug}-${Date.now()}`;

    await ctx.db.insert("episodes", {
      slug: uniqueSlug,
      title: args.title,
      episodeNumber: maxEpisodeNumber + 1,
      publishedAt: new Date().toISOString(),
      durationMs: args.durationMs,
      description: "",
      mediaRecordId,
    });

    return uniqueSlug;
  },
});
