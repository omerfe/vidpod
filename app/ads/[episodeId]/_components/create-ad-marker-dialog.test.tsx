import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorAdAsset } from "@/lib/ads/contracts";
import { CreateAdMarkerDialog } from "./create-ad-marker-dialog";

const { mockMutate } = vi.hoisted(() => ({
  mockMutate: vi.fn().mockResolvedValue(undefined),
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

describe("CreateAdMarkerDialog", () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it("shows the marker type step first with the expected title", () => {
    render(
      <CreateAdMarkerDialog
        open
        onOpenChange={vi.fn()}
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAsset]}
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
      screen.getByRole("button", { name: "Select marker" }),
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
        adLibrary={[sampleAsset]}
        playbackTimeMs={5_200}
      />,
    );

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

  it("uses custom seconds when that placement option is selected", async () => {
    render(
      <CreateAdMarkerDialog
        open
        onOpenChange={vi.fn()}
        episodeSlug="episode-001"
        episodeDurationMs={18_000}
        adLibrary={[sampleAsset]}
        playbackTimeMs={0}
      />,
    );

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
});
