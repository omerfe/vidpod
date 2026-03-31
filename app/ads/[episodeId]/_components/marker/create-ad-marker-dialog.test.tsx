import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorAdAsset } from "@/lib/ads/contracts";
import { CreateAdMarkerDialog } from "./create-ad-marker-dialog";

const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: () => mockMutate,
}));

const sampleAsset: EditorAdAsset = {
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

const sampleAssetTwo: EditorAdAsset = {
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

describe("CreateAdMarkerDialog", () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockMutate.mockImplementation(async (args) => {
      if ("markerId" in args && !("markerType" in args)) {
        return null;
      }

      return {
        id: "marker-1",
        label:
          args.markerType === "ab_test" ? "A/B test insert" : "Marker insert",
        type: args.markerType,
        startMs: args.startMs,
        assignmentCount: args.adAssetIds.length,
        experimentSummary:
          args.markerType === "ab_test"
            ? {
                id: "summary-1",
                confidenceLabel: "Seeded directional signal",
                winningAdAssetId: args.adAssetIds[0],
                updatedAt: 1,
                variants: args.adAssetIds.map(
                  (assetId: string, index: number) => ({
                    adAssetId: assetId,
                    label: index === 0 ? "Coffee Break" : "Creator Tools",
                    impressions: 120 + index * 30,
                    completions: 74 + index * 18,
                    completionRate: index === 0 ? 0.62 : 0.61,
                  }),
                ),
              }
            : null,
      };
    });
  });

  it("shows the marker type step first with the expected title", () => {
    render(
      <CreateAdMarkerDialog
        open
        onOpenChange={vi.fn()}
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAsset, sampleAssetTwo]}
        playbackTimeMs={5_200}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Create ad marker" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Insert a new ad marker into this episode"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create marker" }),
    ).toBeInTheDocument();
  });

  it("submits a static marker after the second step", async () => {
    const onOpenChange = vi.fn();

    render(
      <CreateAdMarkerDialog
        open
        onOpenChange={onOpenChange}
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAsset, sampleAssetTwo]}
        playbackTimeMs={5_200}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Static/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select marker" }));

    fireEvent.click(screen.getByRole("button", { name: /Coffee Break/i }));

    fireEvent.click(screen.getByRole("button", { name: "Create marker" }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });
    expect(mockMutate).toHaveBeenCalledWith({
      episodeSlug: "episode-001",
      markerType: "static",
      startMs: 5200,
      adAssetIds: ["ad-asset-1"],
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("submits an auto marker directly from the first step", async () => {
    const onOpenChange = vi.fn();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

    render(
      <CreateAdMarkerDialog
        open
        onOpenChange={onOpenChange}
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAsset, sampleAssetTwo]}
        playbackTimeMs={5_200}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create marker" }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });
    expect(mockMutate).toHaveBeenCalledWith({
      episodeSlug: "episode-001",
      markerType: "auto",
      startMs: 5200,
      adAssetIds: ["ad-asset-1"],
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    randomSpy.mockRestore();
  });

  it("uses custom seconds when that placement option is selected", async () => {
    render(
      <CreateAdMarkerDialog
        open
        onOpenChange={vi.fn()}
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAsset, sampleAssetTwo]}
        playbackTimeMs={0}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Static/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select marker" }));

    fireEvent.click(screen.getByRole("radio", { name: /Custom time/i }));
    const seconds = screen.getByLabelText("Seconds");
    fireEvent.change(seconds, { target: { value: "12" } });

    fireEvent.click(screen.getByRole("button", { name: /Coffee Break/i }));
    fireEvent.click(screen.getByRole("button", { name: "Create marker" }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        startMs: 12_000,
      }),
    );
  });

  it("resets to the first step when reopened", () => {
    function Harness() {
      const [open, setOpen] = useState(true);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open dialog
          </button>
          <CreateAdMarkerDialog
            open={open}
            onOpenChange={setOpen}
            episodeSlug="episode-001"
            episodeDurationMs={18_000}
            adLibrary={[sampleAsset, sampleAssetTwo]}
            playbackTimeMs={5_200}
          />
        </>
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole("radio", { name: /Static/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select marker" }));
    expect(screen.getByLabelText("Search ads")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));

    expect(
      screen.getByText("Insert a new ad marker into this episode"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create marker" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Search ads")).not.toBeInTheDocument();
  });

  it("submits an A/B test marker and advances to the results step", async () => {
    const onOpenChange = vi.fn();

    render(
      <CreateAdMarkerDialog
        open
        onOpenChange={onOpenChange}
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAsset, sampleAssetTwo]}
        playbackTimeMs={5_200}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /A\/B test/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select marker" }));

    expect(
      screen.getByText("Select which ads you'd like to A/B test."),
    ).toBeInTheDocument();
    expect(screen.getByText("0 ads selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Coffee Break/i }));
    fireEvent.click(screen.getByRole("button", { name: /Creator Tools/i }));

    expect(screen.getByText("2 ads selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create A/B test" }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });
    expect(mockMutate).toHaveBeenCalledWith({
      episodeSlug: "episode-001",
      markerType: "ab_test",
      startMs: 5200,
      adAssetIds: ["ad-asset-1", "ad-asset-2"],
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "A/B test results" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 ads tested")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New test" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("lets the user start a new A/B test from the results step", async () => {
    render(
      <CreateAdMarkerDialog
        open
        onOpenChange={vi.fn()}
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAsset, sampleAssetTwo]}
        playbackTimeMs={5_200}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /A\/B test/i }));
    fireEvent.click(screen.getByRole("button", { name: "Select marker" }));
    fireEvent.click(screen.getByRole("button", { name: /Coffee Break/i }));
    fireEvent.click(screen.getByRole("button", { name: /Creator Tools/i }));
    fireEvent.click(screen.getByRole("button", { name: "Create A/B test" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "A/B test results" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "New test" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "A/B test" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("0 ads selected")).toBeInTheDocument();
    expect(mockMutate).toHaveBeenLastCalledWith({ markerId: "marker-1" });
  });
});
