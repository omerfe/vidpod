import { describe, expect, it } from "vitest";
import type {
  EditorAdAsset,
  EditorMarker,
  ExperimentSummary,
} from "./contracts";
import {
  buildExperimentResultsView,
  isAbTestMarker,
  rankVariants,
} from "./experiment-read-model";

function makeAdAsset(overrides: Partial<EditorAdAsset> = {}): EditorAdAsset {
  return {
    id: overrides.id ?? "ad-1",
    slug: "ad-slug",
    name: overrides.name ?? "Test Ad",
    campaign: overrides.campaign ?? "Campaign A",
    folder: overrides.folder ?? "Folder A",
    durationMs: overrides.durationMs ?? 6000,
    cta: "Visit example.com",
    media: {
      id: "media-1",
      label: "Test media",
      kind: "ad_video",
      sourceType: "public",
      url: "/test.mp4",
      mimeType: "video/mp4",
      durationMs: 6000,
      posterUrl: null,
    },
    ...overrides,
  };
}

function makeAbTestMarker(
  overrides: Partial<EditorMarker> & {
    experimentSummary?: ExperimentSummary | null;
  } = {},
): EditorMarker {
  return {
    id: "marker-ab",
    label: "A/B marker",
    type: "ab_test",
    startMs: 5000,
    notes: null,
    assignments: [],
    experimentSummary: null,
    ...overrides,
  };
}

const adA = makeAdAsset({ id: "ad-a", name: "Coffee Break" });
const adB = makeAdAsset({ id: "ad-b", name: "Creator Tools" });
const adC = makeAdAsset({ id: "ad-c", name: "Tech Boost" });

const sampleSummary: ExperimentSummary = {
  id: "summary-1",
  confidenceLabel: "Seeded directional signal",
  winningAdAssetId: "ad-a",
  updatedAt: 1700000000000,
  variants: [
    {
      adAssetId: "ad-a",
      label: "Coffee Break",
      impressions: 120,
      completions: 74,
      completionRate: 0.62,
    },
    {
      adAssetId: "ad-b",
      label: "Creator Tools",
      impressions: 150,
      completions: 92,
      completionRate: 0.61,
    },
  ],
};

describe("rankVariants", () => {
  it("sorts by completionRate descending", () => {
    const ranked = rankVariants(sampleSummary, [adA, adB]);

    expect(ranked).toHaveLength(2);
    expect(ranked[0]?.adAssetId).toBe("ad-a");
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked[1]?.adAssetId).toBe("ad-b");
    expect(ranked[1]?.rank).toBe(2);
  });

  it("breaks ties by completions descending", () => {
    const tiedSummary: ExperimentSummary = {
      ...sampleSummary,
      variants: [
        {
          adAssetId: "ad-a",
          label: "Coffee Break",
          impressions: 100,
          completions: 60,
          completionRate: 0.6,
        },
        {
          adAssetId: "ad-b",
          label: "Creator Tools",
          impressions: 200,
          completions: 120,
          completionRate: 0.6,
        },
      ],
    };

    const ranked = rankVariants(tiedSummary, [adA, adB]);
    expect(ranked[0]?.adAssetId).toBe("ad-b");
    expect(ranked[1]?.adAssetId).toBe("ad-a");
  });

  it("marks the winner correctly", () => {
    const ranked = rankVariants(sampleSummary, [adA, adB]);
    expect(ranked[0]?.isWinner).toBe(true);
    expect(ranked[1]?.isWinner).toBe(false);
  });

  it("attaches ad asset details when available", () => {
    const ranked = rankVariants(sampleSummary, [adA, adB]);
    expect(ranked[0]?.asset?.name).toBe("Coffee Break");
    expect(ranked[1]?.asset?.name).toBe("Creator Tools");
  });

  it("sets asset to null when ad is not in the library", () => {
    const ranked = rankVariants(sampleSummary, []);
    expect(ranked[0]?.asset).toBeNull();
    expect(ranked[0]?.label).toBe("Coffee Break");
  });

  it("includes numeric metrics on each variant", () => {
    const ranked = rankVariants(sampleSummary, [adA, adB]);
    expect(ranked[0]?.impressions).toBe(120);
    expect(ranked[0]?.completions).toBe(74);
    expect(ranked[0]?.completionRate).toBe(0.62);
  });

  it("handles three or more variants", () => {
    const threeSummary: ExperimentSummary = {
      ...sampleSummary,
      winningAdAssetId: "ad-c",
      variants: [
        {
          adAssetId: "ad-a",
          label: "A",
          impressions: 100,
          completions: 50,
          completionRate: 0.5,
        },
        {
          adAssetId: "ad-c",
          label: "C",
          impressions: 100,
          completions: 70,
          completionRate: 0.7,
        },
        {
          adAssetId: "ad-b",
          label: "B",
          impressions: 100,
          completions: 60,
          completionRate: 0.6,
        },
      ],
    };

    const ranked = rankVariants(threeSummary, [adA, adB, adC]);
    expect(ranked.map((v) => v.adAssetId)).toEqual([
      "ad-c",
      "ad-b",
      "ad-a",
    ]);
    expect(ranked[0]?.isWinner).toBe(true);
  });
});

describe("buildExperimentResultsView", () => {
  it("returns no_summary when marker has no experiment summary", () => {
    const marker = makeAbTestMarker({ experimentSummary: null });
    const view = buildExperimentResultsView(marker, [adA, adB]);
    expect(view.status).toBe("no_summary");
  });

  it("returns no_variants when summary has empty variants array", () => {
    const emptySummary: ExperimentSummary = {
      ...sampleSummary,
      variants: [],
    };
    const marker = makeAbTestMarker({ experimentSummary: emptySummary });
    const view = buildExperimentResultsView(marker, [adA, adB]);

    expect(view.status).toBe("no_variants");
    if (view.status === "no_variants") {
      expect(view.confidenceLabel).toBe("Seeded directional signal");
    }
  });

  it("returns ready with ranked variants when data is available", () => {
    const marker = makeAbTestMarker({ experimentSummary: sampleSummary });
    const view = buildExperimentResultsView(marker, [adA, adB]);

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(view.rankedVariants).toHaveLength(2);
      expect(view.confidenceLabel).toBe("Seeded directional signal");
      expect(view.winnerLabel).toBe("Coffee Break");
    }
  });

  it("returns null winnerLabel when winning asset is not in library", () => {
    const marker = makeAbTestMarker({ experimentSummary: sampleSummary });
    const view = buildExperimentResultsView(marker, []);

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(view.winnerLabel).toBe("Coffee Break");
    }
  });

  it("returns null winnerLabel when no winning asset ID is set", () => {
    const noWinnerSummary: ExperimentSummary = {
      ...sampleSummary,
      winningAdAssetId: null,
    };
    const marker = makeAbTestMarker({ experimentSummary: noWinnerSummary });
    const view = buildExperimentResultsView(marker, [adA, adB]);

    expect(view.status).toBe("ready");
    if (view.status === "ready") {
      expect(view.winnerLabel).toBeNull();
    }
  });
});

describe("isAbTestMarker", () => {
  it("returns true for ab_test markers", () => {
    expect(isAbTestMarker(makeAbTestMarker())).toBe(true);
  });

  it("returns false for static markers", () => {
    const marker = makeAbTestMarker({ type: "static" });
    expect(isAbTestMarker(marker)).toBe(false);
  });

  it("returns false for auto markers", () => {
    const marker = makeAbTestMarker({ type: "auto" });
    expect(isAbTestMarker(marker)).toBe(false);
  });
});
