import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAdPreviewPlayback } from "@/hooks/use-ad-preview-playback";
import type { PlaybackEngine } from "@/hooks/use-playback-engine";
import type { EditorMarker } from "@/lib/ads/contracts";

const markers: EditorMarker[] = [
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
];

function createPlaybackEngine({
  currentTimeMs,
  isPlaying,
  play,
  pause,
  seek,
}: {
  currentTimeMs: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  seek: (ms: number) => void;
}): PlaybackEngine {
  const videoRef = { current: null };

  return {
    currentTimeMs,
    durationMs: 18_000,
    isPlaying,
    play,
    pause,
    togglePlay: vi.fn(),
    seek,
    skipForward: vi.fn(),
    skipBackward: vi.fn(),
    jumpToStart: vi.fn(),
    jumpToEnd: vi.fn(),
    videoRef,
    bindVideoProps: {
      ref: videoRef,
      onTimeUpdate: vi.fn(),
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onLoadedMetadata: vi.fn(),
      onEnded: vi.fn(),
    },
  };
}

describe("useAdPreviewPlayback", () => {
  it("replays ads after seeking back before a marker", async () => {
    const enginePlay = vi.fn();
    const enginePause = vi.fn();
    const engineSeek = vi.fn();
    const adPlay = vi.fn(() => Promise.resolve());

    const { result, rerender } = renderHook(
      ({ currentTimeMs, isPlaying }) =>
        useAdPreviewPlayback(
          createPlaybackEngine({
            currentTimeMs,
            isPlaying,
            play: enginePlay,
            pause: enginePause,
            seek: engineSeek,
          }),
          markers,
        ),
      {
        initialProps: {
          currentTimeMs: 0,
          isPlaying: false,
        },
      },
    );

    const adVideo = document.createElement("video");
    Object.defineProperty(adVideo, "play", {
      configurable: true,
      value: adPlay,
    });

    act(() => {
      result.current.registerAdVideoRef(
        "/mock-ads/ad-coffee-break.mp4",
        adVideo,
      );
    });

    rerender({ currentTimeMs: 2_000, isPlaying: true });

    await waitFor(() => {
      expect(result.current.previewState.mode).toBe("ad");
    });
    expect(enginePause).toHaveBeenCalledTimes(1);
    expect(adPlay).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onAdVideoEnded();
    });

    await waitFor(() => {
      expect(result.current.previewState.mode).toBe("episode");
    });
    expect(engineSeek).toHaveBeenCalledWith(2_001);
    expect(enginePlay).toHaveBeenCalledTimes(1);

    rerender({ currentTimeMs: 0, isPlaying: false });
    rerender({ currentTimeMs: 2_000, isPlaying: true });

    await waitFor(() => {
      expect(enginePause).toHaveBeenCalledTimes(2);
    });
    expect(adPlay).toHaveBeenCalledTimes(2);
  });
});
