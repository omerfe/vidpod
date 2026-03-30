import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  assignmentRoleValidator,
  markerTypeValidator,
  mediaKindValidator,
  mediaSourceTypeValidator,
} from "./lib/validators";

export default defineSchema({
  mediaRecords: defineTable({
    label: v.string(),
    kind: mediaKindValidator,
    sourceType: mediaSourceTypeValidator,
    publicPath: v.optional(v.string()),
    storageKey: v.optional(v.string()),
    cdnUrl: v.optional(v.string()),
    mimeType: v.string(),
    durationMs: v.number(),
    posterPath: v.optional(v.string()),
  }).index("by_kind", ["kind"]),

  episodes: defineTable({
    slug: v.string(),
    title: v.string(),
    episodeNumber: v.number(),
    publishedAt: v.string(),
    durationMs: v.number(),
    description: v.string(),
    mediaRecordId: v.id("mediaRecords"),
  }).index("by_slug", ["slug"]),

  adAssets: defineTable({
    slug: v.string(),
    name: v.string(),
    campaign: v.string(),
    folder: v.string(),
    durationMs: v.number(),
    cta: v.string(),
    status: v.union(v.literal("active"), v.literal("archived")),
    mediaRecordId: v.id("mediaRecords"),
  })
    .index("by_slug", ["slug"])
    .index("by_status_and_name", ["status", "name"])
    .index("by_campaign_and_name", ["campaign", "name"]),

  adMarkers: defineTable({
    episodeId: v.id("episodes"),
    label: v.string(),
    markerType: markerTypeValidator,
    startMs: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_episodeId_and_startMs", ["episodeId", "startMs"])
    .index("by_episodeId_and_markerType", ["episodeId", "markerType"]),

  markerAssignments: defineTable({
    markerId: v.id("adMarkers"),
    adAssetId: v.id("adAssets"),
    role: assignmentRoleValidator,
    sortOrder: v.number(),
    variantKey: v.optional(v.string()),
    variantLabel: v.optional(v.string()),
  })
    .index("by_markerId_and_sortOrder", ["markerId", "sortOrder"])
    .index("by_markerId_and_role", ["markerId", "role"]),

  experimentSummaries: defineTable({
    markerId: v.id("adMarkers"),
    confidenceLabel: v.string(),
    winningAdAssetId: v.optional(v.id("adAssets")),
    updatedAt: v.number(),
    variants: v.array(
      v.object({
        adAssetId: v.id("adAssets"),
        label: v.string(),
        impressions: v.number(),
        completions: v.number(),
        completionRate: v.number(),
      }),
    ),
  }).index("by_markerId", ["markerId"]),
});
