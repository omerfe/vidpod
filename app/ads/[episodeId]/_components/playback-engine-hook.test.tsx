import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePlaybackEngine } from "@/hooks/use-playback-engine";

describe("usePlaybackEngine", () => {
  it("ignores interrupted play requests", async () => {
    const reportError = vi.fn();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const originalReportError = window.reportError;
    Object.assign(window, { reportError });

    try {
      const { result } = renderHook(() => usePlaybackEngine(30_000));
      const video = document.createElement("video");
      const abortError = new DOMException(
        "The play() request was interrupted by a call to pause().",
        "AbortError",
      );

      Object.defineProperty(video, "play", {
        configurable: true,
        value: vi.fn(() => Promise.reject(abortError)),
      });

      Object.assign(result.current.videoRef, { current: video });

      act(() => {
        result.current.play();
      });

      await Promise.resolve();

      expect(reportError).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      if (originalReportError) {
        Object.assign(window, { reportError: originalReportError });
      } else {
        Reflect.deleteProperty(window, "reportError");
      }
    }
  });

  it("reports unexpected play failures", async () => {
    const reportError = vi.fn();
    const originalReportError = window.reportError;
    Object.assign(window, { reportError });

    try {
      const { result } = renderHook(() => usePlaybackEngine(30_000));
      const video = document.createElement("video");
      const error = new Error("Playback exploded");

      Object.defineProperty(video, "play", {
        configurable: true,
        value: vi.fn(() => Promise.reject(error)),
      });

      Object.assign(result.current.videoRef, { current: video });

      act(() => {
        result.current.play();
      });

      await Promise.resolve();

      expect(reportError).toHaveBeenCalledWith(error);
    } finally {
      if (originalReportError) {
        Object.assign(window, { reportError: originalReportError });
      } else {
        Reflect.deleteProperty(window, "reportError");
      }
    }
  });
});
