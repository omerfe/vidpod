import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaybackEngine } from "@/hooks/use-playback-engine";
import { TimelinePanelSlot } from "./timeline-panel";

vi.mock("@/hooks/use-audio-waveform", () => ({
  useAudioWaveform: () => ({ status: "idle" as const }),
}));

vi.mock("./timeline-marker-block", () => ({
  TimelineMarkerBlock: ({ marker }: { marker: { id: string } }) => (
    <div>
      <button data-drag-handle data-marker-id={marker.id} type="button">
        Drag marker
      </button>
    </div>
  ),
}));

vi.mock("./timeline-playhead", () => ({
  TimelinePlayhead: () => null,
}));

vi.mock("./timeline-ticks", () => ({
  TimelineTicks: () => null,
}));

vi.mock("./timeline-toolbar", () => ({
  TimelineToolbar: () => null,
}));

function createEngine(overrides: Partial<PlaybackEngine> = {}): PlaybackEngine {
  const seek = vi.fn();

  return {
    currentTimeMs: 0,
    durationMs: 4_000,
    isPlaying: false,
    play: vi.fn(),
    pause: vi.fn(),
    togglePlay: vi.fn(),
    seek,
    skipForward: vi.fn(),
    skipBackward: vi.fn(),
    jumpToStart: vi.fn(),
    jumpToEnd: vi.fn(),
    videoRef: { current: null },
    bindVideoProps: {
      ref: { current: null },
      onTimeUpdate: vi.fn(),
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onLoadedMetadata: vi.fn(),
      onEnded: vi.fn(),
    },
    ...overrides,
  };
}

describe("TimelinePanelSlot", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("seeks to the clicked point on the timeline track", () => {
    const engine = createEngine();

    render(<TimelinePanelSlot markers={[]} engine={engine} />);

    const track = screen.getByRole("slider", { name: "Timeline scrubber" });
    fireEvent.pointerDown(track, {
      button: 0,
      clientX: 300,
      pointerId: 1,
      pointerType: "mouse",
    });

    expect(engine.seek).toHaveBeenCalledTimes(1);
  });

  it("does not seek when the marker drag handle is pressed", () => {
    const engine = createEngine();
    const onMoveMarker = vi.fn();

    render(
      <TimelinePanelSlot
        markers={[
          {
            id: "marker-1",
            label: "Marker",
            type: "static",
            startMs: 1_000,
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
                  slug: "ad-1",
                  name: "Ad One",
                  campaign: "Campaign",
                  folder: "Folder",
                  durationMs: 1_000,
                  cta: "CTA",
                  media: {
                    id: "media-1",
                    label: "Ad Media",
                    kind: "ad_video",
                    sourceType: "public",
                    url: "/ad.mp4",
                    mimeType: "video/mp4",
                    durationMs: 1_000,
                    posterUrl: null,
                  },
                },
              },
            ],
            experimentSummary: null,
          },
        ]}
        engine={engine}
        onMoveMarker={onMoveMarker}
      />,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Drag marker" }), {
      button: 0,
      clientX: 300,
      pointerId: 1,
      pointerType: "mouse",
    });

    expect(engine.seek).not.toHaveBeenCalled();
  });
});
