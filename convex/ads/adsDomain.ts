import { ConvexError } from "convex/values";
import { normalizeMarkerStartMs } from "../../lib/ads/marker";
import type { Doc } from "../_generated/dataModel";
import type {
  AssignmentRole,
  ExperimentSummary,
  MarkerMutationSummary,
  MarkerType,
} from "../lib/contracts";

export { normalizeMarkerStartMs };

export const primaryEpisodeSlug = "episode-001";

type SeedMediaSpec = {
  label: string;
  kind: Doc<"mediaRecords">["kind"];
  sourceType: Doc<"mediaRecords">["sourceType"];
  publicPath: string;
  mimeType: string;
  durationMs: number;
};

export const seedMediaSpecs = {
  episode001: {
    label: "Episode 001 Source",
    kind: "episode_video",
    sourceType: "public",
    publicPath: "/mock-episodes/episode-001.mp4",
    mimeType: "video/mp4",
    durationMs: 18_000,
  } satisfies SeedMediaSpec,
  episode002: {
    label: "Episode 002 Source",
    kind: "episode_video",
    sourceType: "public",
    publicPath: "/mock-episodes/episode-001.mp4",
    mimeType: "video/mp4",
    durationMs: 18_000,
  } satisfies SeedMediaSpec,
  coffeeBreak: {
    label: "Coffee Break Ad",
    kind: "ad_video",
    sourceType: "public",
    publicPath: "/mock-ads/ad-coffee-break.mp4",
    mimeType: "video/mp4",
    durationMs: 6_000,
  } satisfies SeedMediaSpec,
  creatorTools: {
    label: "Creator Tools Ad",
    kind: "ad_video",
    sourceType: "public",
    publicPath: "/mock-ads/ad-creator-tools.mp4",
    mimeType: "video/mp4",
    durationMs: 6_000,
  } satisfies SeedMediaSpec,
  studioKit: {
    label: "Studio Kit Ad",
    kind: "ad_video",
    sourceType: "public",
    publicPath: "/mock-ads/ad-studio-kit.mp4",
    mimeType: "video/mp4",
    durationMs: 6_000,
  } satisfies SeedMediaSpec,
};

export function normalizeLabel(
  markerType: MarkerType,
  input: string | undefined,
): string {
  const trimmed = input?.trim();

  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }

  if (markerType === "static") {
    return "Static insert";
  }

  if (markerType === "auto") {
    return "Auto insert";
  }

  return "A/B test insert";
}

export function uniqueAssetIds<T extends string>(assetIds: T[]): T[] {
  return [...new Set(assetIds)];
}

export function validateAssignmentIds<T extends string>(
  markerType: MarkerType,
  assetIds: T[],
): T[] {
  const uniqueIds = uniqueAssetIds(assetIds);

  if (markerType === "static" && uniqueIds.length !== 1) {
    throw new ConvexError("Static markers require exactly one ad asset");
  }

  if (markerType === "auto" && uniqueIds.length < 1) {
    throw new ConvexError("Auto markers require at least one candidate ad");
  }

  if (markerType === "ab_test" && uniqueIds.length < 2) {
    throw new ConvexError("A/B test markers require at least two ad options");
  }

  return uniqueIds;
}

export function assertNoExactStartOverlap(args: {
  candidateStartMs: number;
  existingMarkers: { id: string; startMs: number }[];
  excludeMarkerId?: string;
}): void {
  const blocking = args.existingMarkers.find(
    (marker) =>
      marker.startMs === args.candidateStartMs &&
      marker.id !== args.excludeMarkerId,
  );

  if (blocking) {
    throw new ConvexError("Another marker already starts at this timestamp");
  }
}

export function getAssignmentRole(markerType: MarkerType): AssignmentRole {
  if (markerType === "static") {
    return "static";
  }

  if (markerType === "auto") {
    return "auto_candidate";
  }

  return "ab_variant";
}

export function getVariantKey(index: number): string | undefined {
  return index < 26 ? String.fromCharCode(65 + index) : `${index + 1}`;
}

export function getVariantLabel(index: number): string | undefined {
  const key = getVariantKey(index);
  return key ? `Variant ${key}` : undefined;
}

export function toMarkerSummary(args: {
  id: string;
  label: string;
  type: MarkerType;
  startMs: number;
  assignmentCount: number;
  experimentSummary: ExperimentSummary | null;
}): MarkerMutationSummary {
  return args;
}
