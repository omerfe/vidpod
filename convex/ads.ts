import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  createMarker as createMarkerImpl,
  deleteMarker as deleteMarkerImpl,
  updateMarker as updateMarkerImpl,
} from "./ads/adsMarkerLifecycle";
import { listEpisodeItems, loadEpisodeEditorData } from "./ads/adsReadModel";
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
    return await createMarkerImpl(ctx, args);
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
    return await updateMarkerImpl(ctx, args);
  },
});

export const deleteMarker = mutation({
  args: {
    markerId: v.id("adMarkers"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await deleteMarkerImpl(ctx, args);
  },
});
