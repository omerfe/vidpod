import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaybackEngine } from "@/hooks/use-playback-engine";
import { TimelinePanelSlot } from "./timeline-panel";
import { useTimelineMarkerDrag } from "./use-timeline-marker-drag";

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

function createMarker() {
  return {
    id: "marker-1",
    label: "Marker",
    type: "static" as const,
    startMs: 1_000,
    notes: null,
    assignments: [
      {
        id: "assignment-1",
        adAssetId: "ad-1",
        role: "static" as const,
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
            kind: "ad_video" as const,
            sourceType: "public" as const,
            url: "/ad.mp4",
            mimeType: "video/mp4",
            durationMs: 1_000,
            posterUrl: null,
          },
        },
      },
    ],
    experimentSummary: null,
  };
}

function createPointerEvent(
  overrides: Partial<React.PointerEvent>,
): React.PointerEvent {
  return {
    button: 0,
    clientX: 300,
    currentTarget: document.createElement("div"),
    pointerId: 1,
    pointerType: "mouse",
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: document.createElement("div"),
    ...overrides,
  } as React.PointerEvent;
}

describe("TimelinePanelSlot", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: vi.fn(),
    });

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          left: 100,
          top: 0,
          right: 500,
          bottom: 40,
          width: 400,
          height: 40,
          x: 100,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    );
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

  it("clamps seek near the end of the timeline", () => {
    const engine = createEngine();

    render(<TimelinePanelSlot markers={[]} engine={engine} />);

    const track = screen.getByRole("slider", { name: "Timeline scrubber" });
    fireEvent.pointerDown(track, {
      button: 0,
      clientX: 500,
      pointerId: 1,
      pointerType: "mouse",
    });

    expect(engine.seek).toHaveBeenCalledWith(3_000);
  });

  it("does not seek when the marker drag handle is pressed", () => {
    const engine = createEngine();
    const onMoveMarker = vi.fn();

    render(
      <TimelinePanelSlot
        markers={[createMarker()]}
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

describe("useTimelineMarkerDrag", () => {
  it("moves the marker when a drag ends at a new position", () => {
    const onMoveMarker = vi.fn();
    const marker = createMarker();
    const content = document.createElement("div");
    const track = document.createElement("div");
    const dragHandle = document.createElement("button");
    dragHandle.dataset.dragHandle = "";
    dragHandle.dataset.markerId = marker.id;
    track.appendChild(dragHandle);

    vi.spyOn(content, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 0,
      right: 500,
      bottom: 40,
      width: 400,
      height: 40,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const { result } = renderHook(() =>
      useTimelineMarkerDrag({
        contentRef: { current: content },
        trackRef: { current: track },
        expandedDurationMs: 5_000,
        markers: [marker],
        onMoveMarker,
        seekFromClientX: vi.fn(),
        segments: [
          {
            type: "episode",
            startPct: 0,
            widthPct: 20,
            durationMs: 1_000,
            episodeStartMs: 0,
            episodeEndMs: 1_000,
            markerId: null,
          },
          {
            type: "ad",
            startPct: 20,
            widthPct: 20,
            durationMs: 1_000,
            episodeStartMs: 1_000,
            episodeEndMs: 1_000,
            markerId: marker.id,
          },
        ],
      }),
    );

    act(() => {
      result.current.handleTrackPointerDown(
        createPointerEvent({
          clientX: 300,
          pointerId: 1,
          target: dragHandle,
        }),
      );
      result.current.handleTrackPointerMove(
        createPointerEvent({
          clientX: 400,
          pointerId: 1,
          target: track,
        }),
      );
      result.current.handleTrackPointerUp(
        createPointerEvent({
          clientX: 400,
          pointerId: 1,
          target: track,
        }),
      );
    });

    expect(onMoveMarker).toHaveBeenCalledWith("marker-1", 2_250);
  });

  it("does not move the marker when the drag ends at the same position", () => {
    const onMoveMarker = vi.fn();
    const marker = createMarker();
    const content = document.createElement("div");
    const track = document.createElement("div");
    const dragHandle = document.createElement("button");
    dragHandle.dataset.dragHandle = "";
    dragHandle.dataset.markerId = marker.id;
    track.appendChild(dragHandle);

    vi.spyOn(content, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 0,
      right: 500,
      bottom: 40,
      width: 400,
      height: 40,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const { result } = renderHook(() =>
      useTimelineMarkerDrag({
        contentRef: { current: content },
        trackRef: { current: track },
        expandedDurationMs: 5_000,
        markers: [marker],
        onMoveMarker,
        seekFromClientX: vi.fn(),
        segments: [
          {
            type: "episode",
            startPct: 0,
            widthPct: 20,
            durationMs: 1_000,
            episodeStartMs: 0,
            episodeEndMs: 1_000,
            markerId: null,
          },
          {
            type: "ad",
            startPct: 20,
            widthPct: 20,
            durationMs: 1_000,
            episodeStartMs: 1_000,
            episodeEndMs: 1_000,
            markerId: marker.id,
          },
        ],
      }),
    );

    act(() => {
      result.current.handleTrackPointerDown(
        createPointerEvent({
          clientX: 300,
          pointerId: 1,
          target: dragHandle,
        }),
      );
      result.current.handleTrackPointerUp(
        createPointerEvent({
          clientX: 300,
          pointerId: 1,
          target: track,
        }),
      );
    });

    expect(onMoveMarker).not.toHaveBeenCalled();
  });
});
