import { describe, expect, it } from "vitest";
import {
  buildPreviewResolutions,
  findNextMarkerForPreview,
  generateSessionSeed,
  groupAdLibraryByCampaign,
  groupAdLibraryByFolder,
  pickRandomAdAsset,
  resolveAutoMarker,
} from "./ad-selection-service";
import type { EditorAdAsset, EditorMarker } from "./contracts";

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

function makeAutoMarker(
  id: string,
  startMs: number,
  candidateAds: EditorAdAsset[],
): EditorMarker {
  return {
    id,
    label: "Auto marker",
    type: "auto",
    startMs,
    notes: null,
    assignments: candidateAds.map((ad, i) => ({
      id: `assignment-${id}-${i}`,
      adAssetId: ad.id,
      role: "auto_candidate" as const,
      sortOrder: i,
      variantKey: null,
      variantLabel: null,
      adAsset: ad,
    })),
    experimentSummary: null,
  };
}

function makeAbTestMarker(
  id: string,
  startMs: number,
  variantAds: EditorAdAsset[],
): EditorMarker {
  return {
    id,
    label: "A/B marker",
    type: "ab_test",
    startMs,
    notes: null,
    assignments: variantAds.map((ad, i) => ({
      id: `assignment-${id}-${i}`,
      adAssetId: ad.id,
      role: "ab_variant" as const,
      sortOrder: i,
      variantKey: String.fromCharCode(65 + i),
      variantLabel: `Variant ${String.fromCharCode(65 + i)}`,
      adAsset: ad,
    })),
    experimentSummary: null,
  };
}

describe("resolveAutoMarker", () => {
  const adA = makeAdAsset({ id: "ad-a", name: "Ad A" });
  const adB = makeAdAsset({ id: "ad-b", name: "Ad B" });
  const adC = makeAdAsset({ id: "ad-c", name: "Ad C" });

  it("returns null for a marker with no candidates", () => {
    const marker = makeAutoMarker("m1", 5000, []);
    expect(resolveAutoMarker(marker, "session-1")).toBeNull();
  });

  it("returns the only candidate for a single-candidate marker", () => {
    const marker = makeAutoMarker("m1", 5000, [adA]);
    const result = resolveAutoMarker(marker, "session-1");
    expect(result?.id).toBe("ad-a");
  });

  it("resolves deterministically for the same marker+session", () => {
    const marker = makeAutoMarker("m1", 5000, [adA, adB, adC]);
    const result1 = resolveAutoMarker(marker, "session-x");
    const result2 = resolveAutoMarker(marker, "session-x");
    expect(result1?.id).toBe(result2?.id);
  });

  it("can vary resolution across different sessions", () => {
    const marker = makeAutoMarker("m1", 5000, [adA, adB, adC]);
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const result = resolveAutoMarker(marker, `session-${i}`);
      if (result) results.add(result.id);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("produces different results for different marker IDs in the same session", () => {
    const marker1 = makeAutoMarker("marker-1", 5000, [adA, adB, adC]);
    const marker2 = makeAutoMarker("marker-2", 10000, [adA, adB, adC]);

    const results = new Set<string>();
    const seed = "same-session";
    for (let i = 0; i < 50; i++) {
      const m1 = { ...marker1, id: `m1-${i}` };
      const m2 = { ...marker2, id: `m2-${i}` };
      const r1 = resolveAutoMarker(m1, seed);
      const r2 = resolveAutoMarker(m2, seed);
      if (r1) results.add(`1:${r1.id}`);
      if (r2) results.add(`2:${r2.id}`);
    }
    expect(results.size).toBeGreaterThan(2);
  });
});

describe("buildPreviewResolutions", () => {
  const adA = makeAdAsset({ id: "ad-a", name: "Ad A" });
  const adB = makeAdAsset({ id: "ad-b", name: "Ad B" });

  it("resolves static markers via their assignment", () => {
    const staticMarker: EditorMarker = {
      id: "s1",
      label: "Static",
      type: "static",
      startMs: 2000,
      notes: null,
      assignments: [
        {
          id: "a1",
          adAssetId: adA.id,
          role: "static",
          sortOrder: 0,
          variantKey: null,
          variantLabel: null,
          adAsset: adA,
        },
      ],
      experimentSummary: null,
    };

    const resolutions = buildPreviewResolutions([staticMarker], "seed");
    expect(resolutions.get("s1")?.resolvedAd.id).toBe("ad-a");
  });

  it("resolves auto markers deterministically", () => {
    const autoMarker = makeAutoMarker("auto-1", 8000, [adA, adB]);
    const resolutions = buildPreviewResolutions([autoMarker], "seed-123");
    const resolution = resolutions.get("auto-1");
    expect(resolution).toBeDefined();
    expect(["ad-a", "ad-b"]).toContain(resolution?.resolvedAd.id);
  });

  it("resolves A/B test markers to one configured variant", () => {
    const abMarker = makeAbTestMarker("ab-1", 9000, [adA, adB]);
    const resolutions = buildPreviewResolutions([abMarker], "seed-123");
    const resolution = resolutions.get("ab-1");
    expect(resolution).toBeDefined();
    expect(["ad-a", "ad-b"]).toContain(resolution?.resolvedAd.id);
  });

  it("skips markers with no valid assignments", () => {
    const emptyMarker = makeAutoMarker("empty", 3000, []);
    const resolutions = buildPreviewResolutions([emptyMarker], "seed");
    expect(resolutions.has("empty")).toBe(false);
  });
});

describe("groupAdLibraryByFolder", () => {
  const adA = makeAdAsset({ id: "a", folder: "Mid-roll" });
  const adB = makeAdAsset({ id: "b", folder: "Host Reads" });
  const adC = makeAdAsset({ id: "c", folder: "Mid-roll" });

  it("groups assets by folder and sorts alphabetically", () => {
    const groups = groupAdLibraryByFolder([adA, adB, adC]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.label).toBe("Host Reads");
    expect(groups[1]?.label).toBe("Mid-roll");
    expect(groups[1]?.assets).toHaveLength(2);
  });
});

describe("groupAdLibraryByCampaign", () => {
  const adA = makeAdAsset({ id: "a", campaign: "Spring Sponsors" });
  const adB = makeAdAsset({ id: "b", campaign: "Platform Partners" });
  const adC = makeAdAsset({ id: "c", campaign: "Spring Sponsors" });

  it("groups assets by campaign and sorts alphabetically", () => {
    const groups = groupAdLibraryByCampaign([adA, adB, adC]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.label).toBe("Platform Partners");
    expect(groups[1]?.label).toBe("Spring Sponsors");
    expect(groups[1]?.assets).toHaveLength(2);
  });
});

describe("pickRandomAdAsset", () => {
  const adA = makeAdAsset({ id: "a" });
  const adB = makeAdAsset({ id: "b" });

  it("returns null for an empty pool", () => {
    expect(pickRandomAdAsset([])).toBeNull();
  });

  it("returns an asset from the pool", () => {
    expect(pickRandomAdAsset([adA, adB], () => 0)?.id).toBe("a");
    expect(pickRandomAdAsset([adA, adB], () => 0.99)?.id).toBe("b");
  });
});

describe("findNextMarkerForPreview", () => {
  const adA = makeAdAsset({ id: "ad-a" });
  const marker1 = makeAutoMarker("m1", 5000, [adA]);
  const marker2 = makeAutoMarker("m2", 10000, [adA]);

  it("finds a marker within tolerance", () => {
    const resolutions = buildPreviewResolutions([marker1, marker2], "seed");
    const result = findNextMarkerForPreview(
      [marker1, marker2],
      5100,
      resolutions,
    );
    expect(result?.marker.id).toBe("m1");
  });

  it("returns null when no marker is close enough", () => {
    const resolutions = buildPreviewResolutions([marker1, marker2], "seed");
    const result = findNextMarkerForPreview(
      [marker1, marker2],
      7000,
      resolutions,
    );
    expect(result).toBeNull();
  });
});

describe("generateSessionSeed", () => {
  it("produces unique seeds", () => {
    const seeds = new Set(
      Array.from({ length: 10 }, () => generateSessionSeed()),
    );
    expect(seeds.size).toBe(10);
  });
});
