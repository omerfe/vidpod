import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { modules } from "../../test/convexModuleGlob";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

describe("ads backend", () => {
  it("seeds and hydrates episode editor data", async () => {
    const t = convexTest(schema, modules);

    const seedResult = await t.mutation(internal.ads.seed.seedMvpData, {});
    expect(seedResult).toEqual({
      seeded: true,
      primaryEpisodeSlug: "episode-001",
      episodeCount: 2,
    });

    const episodes = await t.query(api.ads.listEpisodes, {});
    expect(episodes).toHaveLength(2);
    expect(episodes[0]?.slug).toBe("episode-001");

    const editorData = await t.query(api.ads.getEpisodeEditorData, {
      episodeSlug: seedResult.primaryEpisodeSlug,
    });

    expect(editorData).not.toBeNull();
    expect(editorData?.episode.media.url).toBe(
      "/mock-episodes/episode-001.mp4",
    );
    expect(editorData?.markers).toHaveLength(3);
    expect(editorData?.stats.abTestMarkers).toBe(1);
  });

  it("creates, updates, validates, and deletes markers", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.ads.seed.seedMvpData, {});

    const initialData = await t.query(api.ads.getEpisodeEditorData, {
      episodeSlug: "episode-001",
    });

    if (!initialData) {
      throw new Error("Expected seeded editor data");
    }

    const [assetA, assetB] = initialData.adLibrary;

    if (!assetA || !assetB) {
      throw new Error("Expected seeded ad assets");
    }

    await expect(
      t.mutation(api.ads.createMarker, {
        episodeSlug: "episode-001",
        markerType: "ab_test",
        startMs: 10_000,
        adAssetIds: [assetA.id as Id<"adAssets">],
      }),
    ).rejects.toThrow("A/B test markers require at least two ad options");

    await expect(
      t.mutation(api.ads.createMarker, {
        episodeSlug: "episode-001",
        markerType: "static",
        startMs: 2_000,
        adAssetIds: [assetA.id as Id<"adAssets">],
      }),
    ).rejects.toThrow("Another marker already starts at this timestamp");

    const createdMarker = await t.mutation(api.ads.createMarker, {
      episodeSlug: "episode-001",
      markerType: "static",
      startMs: 10_000,
      label: "Late sponsor",
      adAssetIds: [assetA.id as Id<"adAssets">],
    });

    expect(createdMarker.assignmentCount).toBe(1);
    expect(createdMarker.type).toBe("static");

    await expect(
      t.mutation(api.ads.updateMarker, {
        markerId: createdMarker.id as Id<"adMarkers">,
        startMs: 2_000,
      }),
    ).rejects.toThrow("Another marker already starts at this timestamp");

    const updatedMarker = await t.mutation(api.ads.updateMarker, {
      markerId: createdMarker.id as Id<"adMarkers">,
      markerType: "auto",
      startMs: 11_000,
      label: "Late dynamic slot",
      adAssetIds: [assetA.id as Id<"adAssets">, assetB.id as Id<"adAssets">],
    });

    expect(updatedMarker.type).toBe("auto");
    expect(updatedMarker.assignmentCount).toBe(2);

    await t.mutation(api.ads.deleteMarker, {
      markerId: createdMarker.id as Id<"adMarkers">,
    });

    const finalData = await t.query(api.ads.getEpisodeEditorData, {
      episodeSlug: "episode-001",
    });

    expect(
      finalData?.markers.find((marker) => marker.id === createdMarker.id),
    ).toBe(undefined);
  });

  it("creates auto markers with candidate assignments", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.ads.seed.seedMvpData, {});

    const editorData = await t.query(api.ads.getEpisodeEditorData, {
      episodeSlug: "episode-001",
    });

    if (!editorData) throw new Error("Expected seeded editor data");

    const [assetA, assetB] = editorData.adLibrary;
    if (!assetA || !assetB) throw new Error("Expected seeded ad assets");

    const result = await t.mutation(api.ads.createMarker, {
      episodeSlug: "episode-001",
      markerType: "auto",
      startMs: 12_000,
      label: "Auto mid-roll",
      adAssetIds: [assetA.id as Id<"adAssets">, assetB.id as Id<"adAssets">],
    });

    expect(result.type).toBe("auto");
    expect(result.assignmentCount).toBe(2);

    const updatedData = await t.query(api.ads.getEpisodeEditorData, {
      episodeSlug: "episode-001",
    });

    const autoMarker = updatedData?.markers.find((m) => m.id === result.id);
    expect(autoMarker).toBeDefined();
    expect(autoMarker?.type).toBe("auto");
    expect(autoMarker?.assignments).toHaveLength(2);
    expect(
      autoMarker?.assignments.every((a) => a.role === "auto_candidate"),
    ).toBe(true);
  });

  it("rejects auto markers with zero candidates", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.ads.seed.seedMvpData, {});

    await expect(
      t.mutation(api.ads.createMarker, {
        episodeSlug: "episode-001",
        markerType: "auto",
        startMs: 12_000,
        adAssetIds: [],
      }),
    ).rejects.toThrow("Auto markers require at least one candidate ad");
  });

  it("persists auto markers and reloads them with assignments", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.ads.seed.seedMvpData, {});

    const editorData = await t.query(api.ads.getEpisodeEditorData, {
      episodeSlug: "episode-001",
    });

    if (!editorData) throw new Error("Expected seeded data");

    const allAssets = editorData.adLibrary;
    const autoResult = await t.mutation(api.ads.createMarker, {
      episodeSlug: "episode-001",
      markerType: "auto",
      startMs: 16_000,
      adAssetIds: allAssets.map((a) => a.id) as Id<"adAssets">[],
    });

    const reloaded = await t.query(api.ads.getEpisodeEditorData, {
      episodeSlug: "episode-001",
    });

    const marker = reloaded?.markers.find((m) => m.id === autoResult.id);
    expect(marker?.assignments).toHaveLength(allAssets.length);
    expect(marker?.experimentSummary).toBeNull();
  });
});
