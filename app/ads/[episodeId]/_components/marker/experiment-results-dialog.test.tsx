import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  EditorAdAsset,
  EditorMarker,
  ExperimentSummary,
} from "@/lib/ads/contracts";

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
}));

import { MarkerPanelSlot } from "./marker-panel";

const sampleAssetA: EditorAdAsset = {
  id: "ad-asset-1",
  slug: "coffee-break",
  name: "Coffee Break",
  campaign: "Spring Sponsors",
  folder: "Host Reads",
  durationMs: 6_000,
  cta: "Visit coffeebreak.example/vidpod",
  media: {
    id: "media-1",
    label: "Coffee Break Ad",
    kind: "ad_video",
    sourceType: "public",
    url: "/mock-ads/ad-coffee-break.mp4",
    mimeType: "video/mp4",
    durationMs: 6_000,
    posterUrl: null,
  },
};

const sampleAssetB: EditorAdAsset = {
  id: "ad-asset-2",
  slug: "creator-tools",
  name: "Creator Tools",
  campaign: "Platform Partners",
  folder: "Mid-roll",
  durationMs: 6_000,
  cta: "Visit creatortools.example/vidpod",
  media: {
    id: "media-2",
    label: "Creator Tools Ad",
    kind: "ad_video",
    sourceType: "public",
    url: "/mock-ads/ad-creator-tools.mp4",
    mimeType: "video/mp4",
    durationMs: 6_000,
    posterUrl: null,
  },
};

const sampleSummary: ExperimentSummary = {
  id: "summary-1",
  confidenceLabel: "Seeded directional signal",
  winningAdAssetId: "ad-asset-1",
  updatedAt: 1700000000000,
  variants: [
    {
      adAssetId: "ad-asset-1",
      label: "Coffee Break",
      impressions: 120,
      completions: 74,
      completionRate: 0.62,
    },
    {
      adAssetId: "ad-asset-2",
      label: "Creator Tools",
      impressions: 150,
      completions: 92,
      completionRate: 0.61,
    },
  ],
};

const abTestMarker: EditorMarker = {
  id: "marker-ab",
  label: "A/B test insert",
  type: "ab_test",
  startMs: 5_000,
  notes: null,
  assignments: [
    {
      id: "asgn-1",
      adAssetId: "ad-asset-1",
      role: "ab_variant",
      sortOrder: 0,
      variantKey: "A",
      variantLabel: "Variant A",
      adAsset: sampleAssetA,
    },
    {
      id: "asgn-2",
      adAssetId: "ad-asset-2",
      role: "ab_variant",
      sortOrder: 1,
      variantKey: "B",
      variantLabel: "Variant B",
      adAsset: sampleAssetB,
    },
  ],
  experimentSummary: sampleSummary,
};

const staticMarker: EditorMarker = {
  id: "marker-static",
  label: "Static insert",
  type: "static",
  startMs: 2_000,
  notes: null,
  assignments: [
    {
      id: "asgn-3",
      adAssetId: "ad-asset-1",
      role: "static",
      sortOrder: 0,
      variantKey: null,
      variantLabel: null,
      adAsset: sampleAssetA,
    },
  ],
  experimentSummary: null,
};

const abTestMarkerNoSummary: EditorMarker = {
  ...abTestMarker,
  id: "marker-ab-no-summary",
  experimentSummary: null,
};

describe("ExperimentResultsDialog via MarkerPanel", () => {
  it("shows Results button only for A/B test markers and Edit only for non-A/B markers", () => {
    render(
      <MarkerPanelSlot
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAssetA, sampleAssetB]}
        markers={[staticMarker, abTestMarker]}
        playbackTimeMs={0}
      />,
    );

    const resultsButtons = screen.getAllByRole("button", { name: /Results/i });
    expect(resultsButtons).toHaveLength(1);

    const editButtons = screen.getAllByRole("button", { name: /Edit/i });
    expect(editButtons).toHaveLength(1);
  });

  it("opens the results dialog when clicking Results on an A/B marker", async () => {
    render(
      <MarkerPanelSlot
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAssetA, sampleAssetB]}
        markers={[abTestMarker]}
        playbackTimeMs={0}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Results/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "A/B test results" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("2 variants tested")).toBeInTheDocument();
    expect(screen.getAllByText("Coffee Break").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText("Creator Tools")).toBeInTheDocument();
    expect(screen.getByText("Seeded directional signal")).toBeInTheDocument();
  });

  it("closes the results dialog when clicking Done", async () => {
    render(
      <MarkerPanelSlot
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAssetA, sampleAssetB]}
        markers={[abTestMarker]}
        playbackTimeMs={0}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Results/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "A/B test results" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "A/B test results" }),
      ).not.toBeInTheDocument();
    });
  });

  it("shows empty state when marker has no experiment summary", async () => {
    render(
      <MarkerPanelSlot
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAssetA, sampleAssetB]}
        markers={[abTestMarkerNoSummary]}
        playbackTimeMs={0}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Results/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "A/B test results" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("No experiment data is available for this marker yet."),
    ).toBeInTheDocument();
  });

  it("shows the leading variant label when a winner is set", async () => {
    render(
      <MarkerPanelSlot
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAssetA, sampleAssetB]}
        markers={[abTestMarker]}
        playbackTimeMs={0}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Results/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "A/B test results" }),
      ).toBeInTheDocument();
    });

    expect(screen.getAllByText("Coffee Break").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.getByText((_content, element) => {
        return element?.textContent === "Leading variant: Coffee Break";
      }),
    ).toBeInTheDocument();
  });
});
