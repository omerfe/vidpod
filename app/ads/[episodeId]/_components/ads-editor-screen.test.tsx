import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EpisodeEditorData, EpisodeListItem } from "@/lib/ads/contracts";
import { AdsEditorScreen } from "./ads-editor-screen";
import { useAdsWorkspaceSession } from "./use-ads-workspace-session";
import type { EditorSession } from "./use-editor-session";

vi.mock("./use-ads-workspace-session", () => ({
  useAdsWorkspaceSession: vi.fn(),
}));

vi.mock("./marker/create-ad-marker-dialog", () => ({
  CreateAdMarkerDialog: () => null,
}));

vi.mock("./use-editor-session", () => ({
  useEditorSession: (opts: {
    serverMarkers: EditorSession["markers"];
  }): EditorSession => ({
    markers: opts.serverMarkers,
    moveMarker: vi.fn(),
    deleteMarker: vi.fn(),
    trackCreation: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    isProcessing: false,
  }),
}));

const mockedUseAdsWorkspaceSession = vi.mocked(useAdsWorkspaceSession);

const episodes: EpisodeListItem[] = [
  {
    slug: "episode-001",
    title: "Creator Workflow Deep Dive",
    episodeNumber: 12,
    publishedAt: "2026-03-20T08:00:00.000Z",
    durationMs: 18_000,
    markerCount: 2,
  },
  {
    slug: "episode-002",
    title: "Scaling a Video Podcast Stack",
    episodeNumber: 13,
    publishedAt: "2026-03-27T08:00:00.000Z",
    durationMs: 18_000,
    markerCount: 1,
  },
];

const readyEditorData: EpisodeEditorData = {
  episode: {
    id: "episode-001-id",
    slug: "episode-001",
    title: "Creator Workflow Deep Dive",
    episodeNumber: 12,
    publishedAt: "2026-03-20T08:00:00.000Z",
    durationMs: 18_000,
    description: "Seeded editor episode.",
    media: {
      id: "media-episode-001",
      label: "Episode 001 Source",
      kind: "episode_video",
      sourceType: "public",
      url: "/mock-episodes/episode-001.mp4",
      mimeType: "video/mp4",
      durationMs: 18_000,
      posterUrl: null,
    },
  },
  adLibrary: [
    {
      id: "ad-1",
      slug: "coffee-break",
      name: "Coffee Break",
      campaign: "Spring Sponsors",
      folder: "Host Reads",
      durationMs: 6_000,
      cta: "Visit coffeebreak.example/vidpod",
      media: {
        id: "media-ad-1",
        label: "Coffee Break Ad",
        kind: "ad_video",
        sourceType: "public",
        url: "/mock-ads/ad-coffee-break.mp4",
        mimeType: "video/mp4",
        durationMs: 6_000,
        posterUrl: null,
      },
    },
  ],
  markers: [
    {
      id: "marker-1",
      label: "Cold open sponsor",
      type: "static",
      startMs: 2_000,
      notes: null,
      assignments: [
        {
          id: "assignment-1",
          adAssetId: "ad-1",
          role: "static",
          sortOrder: 0,
          variantKey: null,
          variantLabel: null,
          adAsset: {
            id: "ad-1",
            slug: "coffee-break",
            name: "Coffee Break",
            campaign: "Spring Sponsors",
            folder: "Host Reads",
            durationMs: 6_000,
            cta: "Visit coffeebreak.example/vidpod",
            media: {
              id: "media-ad-1",
              label: "Coffee Break Ad",
              kind: "ad_video",
              sourceType: "public",
              url: "/mock-ads/ad-coffee-break.mp4",
              mimeType: "video/mp4",
              durationMs: 6_000,
              posterUrl: null,
            },
          },
        },
      ],
      experimentSummary: null,
    },
    {
      id: "marker-2",
      label: "Outro experiment",
      type: "ab_test",
      startMs: 14_000,
      notes: null,
      assignments: [
        {
          id: "assignment-2",
          adAssetId: "ad-2",
          role: "ab_variant",
          sortOrder: 0,
          variantKey: "A",
          variantLabel: "Variant A",
          adAsset: {
            id: "ad-2",
            slug: "creator-tools",
            name: "Creator Tools",
            campaign: "Platform Partners",
            folder: "Mid-roll",
            durationMs: 6_000,
            cta: "Start a trial at creatortools.example",
            media: {
              id: "media-ad-2",
              label: "Creator Tools Ad",
              kind: "ad_video",
              sourceType: "public",
              url: "/mock-ads/ad-creator-tools.mp4",
              mimeType: "video/mp4",
              durationMs: 6_000,
              posterUrl: null,
            },
          },
        },
      ],
      experimentSummary: {
        id: "summary-1",
        confidenceLabel: "Seeded directional signal",
        winningAdAssetId: "ad-2",
        updatedAt: 1,
        variants: [
          {
            adAssetId: "ad-2",
            label: "Creator Tools",
            impressions: 120,
            completions: 74,
            completionRate: 0.62,
          },
        ],
      },
    },
  ],
  stats: {
    totalMarkers: 2,
    staticMarkers: 1,
    autoMarkers: 0,
    abTestMarkers: 1,
  },
};

describe("AdsEditorScreen", () => {
  beforeEach(() => {
    mockedUseAdsWorkspaceSession.mockReset();
  });

  it("shows a loading state while the workspace session is unresolved", () => {
    mockedUseAdsWorkspaceSession.mockReturnValue({
      status: "loading",
      episodeSlug: "episode-001",
    });

    render(<AdsEditorScreen episodeSlug="episode-001" />);

    expect(screen.getByText("Loading ads editor")).toBeInTheDocument();
  });

  it("renders a not-found state with episode recovery links", () => {
    mockedUseAdsWorkspaceSession.mockReturnValue({
      status: "missing-episode",
      episodeSlug: "missing-episode",
      episodes,
    });

    render(<AdsEditorScreen episodeSlug="missing-episode" />);

    expect(screen.getByText("Episode not found")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Creator Workflow Deep Dive" }),
    ).toHaveAttribute("href", "/ads/episode-001");
    expect(
      screen.getByRole("link", { name: "Scaling a Video Podcast Stack" }),
    ).toHaveAttribute("href", "/ads/episode-002");
  });

  it("renders the seeded episode workspace and marker metadata", () => {
    mockedUseAdsWorkspaceSession.mockReturnValue({
      status: "ready",
      episodeSlug: "episode-001",
      editorData: readyEditorData,
      episodes,
    });

    render(<AdsEditorScreen episodeSlug="episode-001" />);

    expect(
      screen.getByRole("heading", { name: "Creator Workflow Deep Dive" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("00:00:02").length).toBeGreaterThan(0);
    expect(screen.getByText("A/B test")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create ad marker" }),
    ).toBeInTheDocument();
  });

  it("shows the marker-panel empty state when an episode has no markers", () => {
    mockedUseAdsWorkspaceSession.mockReturnValue({
      status: "ready",
      episodeSlug: "episode-001",
      editorData: {
        ...readyEditorData,
        markers: [],
        stats: {
          totalMarkers: 0,
          staticMarkers: 0,
          autoMarkers: 0,
          abTestMarkers: 0,
        },
      },
      episodes,
    });

    render(<AdsEditorScreen episodeSlug="episode-001" />);

    expect(
      screen.getByText(
        "No markers yet. This episode is ready for the first ad insert.",
      ),
    ).toBeInTheDocument();
  });
});
