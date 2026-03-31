import { v } from "convex/values";

export const markerTypeValidator = v.union(
  v.literal("static"),
  v.literal("auto"),
  v.literal("ab_test"),
);

export const mediaSourceTypeValidator = v.union(
  v.literal("public"),
  v.literal("r2"),
);

export const mediaKindValidator = v.union(
  v.literal("episode_video"),
  v.literal("ad_video"),
);

export const assignmentRoleValidator = v.union(
  v.literal("static"),
  v.literal("auto_candidate"),
  v.literal("ab_variant"),
);

export const resolvedMediaValidator = v.object({
  id: v.string(),
  label: v.string(),
  kind: mediaKindValidator,
  sourceType: mediaSourceTypeValidator,
  url: v.string(),
  mimeType: v.string(),
  durationMs: v.number(),
  posterUrl: v.union(v.string(), v.null()),
});

export const episodeListItemValidator = v.object({
  slug: v.string(),
  title: v.string(),
  episodeNumber: v.number(),
  publishedAt: v.string(),
  durationMs: v.number(),
  markerCount: v.number(),
});

export const editorEpisodeValidator = v.object({
  id: v.string(),
  slug: v.string(),
  title: v.string(),
  episodeNumber: v.number(),
  publishedAt: v.string(),
  durationMs: v.number(),
  description: v.string(),
  media: resolvedMediaValidator,
});

export const editorAdAssetValidator = v.object({
  id: v.string(),
  slug: v.string(),
  name: v.string(),
  campaign: v.string(),
  folder: v.string(),
  durationMs: v.number(),
  cta: v.string(),
  media: resolvedMediaValidator,
});

export const editorMarkerAssignmentValidator = v.object({
  id: v.string(),
  adAssetId: v.string(),
  role: assignmentRoleValidator,
  sortOrder: v.number(),
  variantKey: v.union(v.string(), v.null()),
  variantLabel: v.union(v.string(), v.null()),
  adAsset: editorAdAssetValidator,
});

export const experimentVariantPerformanceValidator = v.object({
  adAssetId: v.string(),
  label: v.string(),
  impressions: v.number(),
  completions: v.number(),
  completionRate: v.number(),
});

export const experimentSummaryValidator = v.object({
  id: v.string(),
  confidenceLabel: v.string(),
  winningAdAssetId: v.union(v.string(), v.null()),
  updatedAt: v.number(),
  variants: v.array(experimentVariantPerformanceValidator),
});

export const editorMarkerValidator = v.object({
  id: v.string(),
  label: v.string(),
  type: markerTypeValidator,
  startMs: v.number(),
  notes: v.union(v.string(), v.null()),
  assignments: v.array(editorMarkerAssignmentValidator),
  experimentSummary: v.union(experimentSummaryValidator, v.null()),
});

export const episodeEditorStatsValidator = v.object({
  totalMarkers: v.number(),
  staticMarkers: v.number(),
  autoMarkers: v.number(),
  abTestMarkers: v.number(),
});

export const episodeEditorDataValidator = v.object({
  episode: editorEpisodeValidator,
  adLibrary: v.array(editorAdAssetValidator),
  markers: v.array(editorMarkerValidator),
  stats: episodeEditorStatsValidator,
});

export const markerMutationSummaryValidator = v.object({
  id: v.string(),
  label: v.string(),
  type: markerTypeValidator,
  startMs: v.number(),
  assignmentCount: v.number(),
  experimentSummary: v.union(experimentSummaryValidator, v.null()),
});
