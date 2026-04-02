"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampTimeMs,
  msToSeconds,
  secondsToMs,
  skipBackwardMs,
  skipForwardMs,
} from "@/lib/ads/playback-engine";

function isInterruptedPlayError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const name =
    "name" in error && typeof error.name === "string" ? error.name : null;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : null;

  if (name === "AbortError") {
    return true;
  }

  return message?.includes("interrupted by a call to pause") ?? false;
}

function reportPlaybackError(error: unknown): void {
  if (
    typeof window !== "undefined" &&
    typeof window.reportError === "function"
  ) {
    window.reportError(error);
    return;
  }

  console.error(error);
}

function playMedia(video: HTMLMediaElement | null): void {
  if (!video) {
    return;
  }

  const playPromise = video.play();
  if (playPromise === undefined) {
    return;
  }

  void playPromise.catch((error: unknown) => {
    if (isInterruptedPlayError(error)) {
      return;
    }

    reportPlaybackError(error);
  });
}

export interface PlaybackState {
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
}

export interface PlaybackActions {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (ms: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
}

export interface PlaybackEngine extends PlaybackState, PlaybackActions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  bindVideoProps: {
    ref: React.RefObject<HTMLVideoElement | null>;
    onTimeUpdate: React.ReactEventHandler<HTMLVideoElement>;
    onPlay: React.ReactEventHandler<HTMLVideoElement>;
    onPause: React.ReactEventHandler<HTMLVideoElement>;
    onLoadedMetadata: React.ReactEventHandler<HTMLVideoElement>;
    onEnded: React.ReactEventHandler<HTMLVideoElement>;
  };
}

export function usePlaybackEngine(episodeDurationMs: number): PlaybackEngine {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(episodeDurationMs);

  useEffect(() => {
    setDurationMs(episodeDurationMs);
  }, [episodeDurationMs]);

  const play = useCallback(() => {
    playMedia(videoRef.current);
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      playMedia(video);
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback(
    (ms: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clamped = clampTimeMs(ms, durationMs);
      video.currentTime = msToSeconds(clamped);
      setCurrentTimeMs(clamped);
    },
    [durationMs],
  );

  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = skipForwardMs(secondsToMs(video.currentTime), durationMs);
    video.currentTime = msToSeconds(next);
    setCurrentTimeMs(next);
  }, [durationMs]);

  const skipBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = skipBackwardMs(secondsToMs(video.currentTime), durationMs);
    video.currentTime = msToSeconds(next);
    setCurrentTimeMs(next);
  }, [durationMs]);

  const jumpToStart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setCurrentTimeMs(0);
  }, []);

  const jumpToEnd = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = msToSeconds(durationMs);
    setCurrentTimeMs(durationMs);
  }, [durationMs]);

  const onTimeUpdate: React.ReactEventHandler<HTMLVideoElement> = useCallback(
    (e) => {
      setCurrentTimeMs(secondsToMs(e.currentTarget.currentTime));
    },
    [],
  );

  const onPlay: React.ReactEventHandler<HTMLVideoElement> = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const onPause: React.ReactEventHandler<HTMLVideoElement> = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const onLoadedMetadata: React.ReactEventHandler<HTMLVideoElement> =
    useCallback((e) => {
      const videoDuration = secondsToMs(e.currentTarget.duration);
      if (videoDuration > 0 && Number.isFinite(videoDuration)) {
        setDurationMs(videoDuration);
      }
    }, []);

  const onEnded: React.ReactEventHandler<HTMLVideoElement> = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return {
    videoRef,
    currentTimeMs,
    durationMs,
    isPlaying,
    play,
    pause,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    jumpToStart,
    jumpToEnd,
    bindVideoProps: {
      ref: videoRef,
      onTimeUpdate,
      onPlay,
      onPause,
      onLoadedMetadata,
      onEnded,
    },
  };
}
