export const markerTypeValues = ["static", "auto", "ab_test"] as const;
export const mediaSourceTypeValues = ["public", "r2"] as const;
export const mediaKindValues = ["episode_video", "ad_video"] as const;
export const assignmentRoleValues = [
  "static",
  "auto_candidate",
  "ab_variant",
] as const;

export type MarkerType = (typeof markerTypeValues)[number];
export type MediaSourceType = (typeof mediaSourceTypeValues)[number];
export type MediaKind = (typeof mediaKindValues)[number];
export type AssignmentRole = (typeof assignmentRoleValues)[number];

export type ResolvedMedia = {
  id: string;
  label: string;
  kind: MediaKind;
  sourceType: MediaSourceType;
  url: string;
  mimeType: string;
  durationMs: number;
  posterUrl: string | null;
};

export type EpisodeListItem = {
  slug: string;
  title: string;
  episodeNumber: number;
  publishedAt: string;
  durationMs: number;
  markerCount: number;
};

export type EditorEpisode = {
  id: string;
  slug: string;
  title: string;
  episodeNumber: number;
  publishedAt: string;
  durationMs: number;
  description: string;
  media: ResolvedMedia;
};

export type EditorAdAsset = {
  id: string;
  slug: string;
  name: string;
  campaign: string;
  folder: string;
  durationMs: number;
  cta: string;
  media: ResolvedMedia;
};

export type EditorMarkerAssignment = {
  id: string;
  adAssetId: string;
  role: AssignmentRole;
  sortOrder: number;
  variantKey: string | null;
  variantLabel: string | null;
  adAsset: EditorAdAsset;
};

export type ExperimentVariantPerformance = {
  adAssetId: string;
  label: string;
  impressions: number;
  completions: number;
  completionRate: number;
};

export type ExperimentSummary = {
  id: string;
  confidenceLabel: string;
  winningAdAssetId: string | null;
  updatedAt: number;
  variants: ExperimentVariantPerformance[];
};

export type EditorMarker = {
  id: string;
  label: string;
  type: MarkerType;
  startMs: number;
  notes: string | null;
  assignments: EditorMarkerAssignment[];
  experimentSummary: ExperimentSummary | null;
};

export type EpisodeEditorStats = {
  totalMarkers: number;
  staticMarkers: number;
  autoMarkers: number;
  abTestMarkers: number;
};

export type EpisodeEditorData = {
  episode: EditorEpisode;
  adLibrary: EditorAdAsset[];
  markers: EditorMarker[];
  stats: EpisodeEditorStats;
};

export type MarkerMutationSummary = {
  id: string;
  label: string;
  type: MarkerType;
  startMs: number;
  assignmentCount: number;
  experimentSummary: ExperimentSummary | null;
};
