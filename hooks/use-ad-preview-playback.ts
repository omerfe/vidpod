"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type AdPreviewResolution,
  buildPreviewResolutions,
  generateSessionSeed,
} from "@/lib/ads/ad-selection-service";
import type { EditorAdAsset, EditorMarker } from "@/lib/ads/contracts";
import type { PlaybackEngine } from "./use-playback-engine";

export type AdPreviewState =
  | { mode: "episode" }
  | {
      mode: "ad";
      markerId: string;
      ad: EditorAdAsset;
      resumeTimeMs: number;
    };

export interface AdPreviewPlayback {
  previewState: AdPreviewState;
  adProgressMs: number;
  isPlaying: boolean;
  preloadUrls: string[];
  activeAdUrl: string | null;
  registerAdVideoRef: (url: string, el: HTMLVideoElement | null) => void;
  onAdVideoEnded: () => void;
  togglePlay: () => void;
  resolutions: Map<string, AdPreviewResolution>;
  sessionSeed: string;
  resetSession: () => void;
}

export function useAdPreviewPlayback(
  engine: PlaybackEngine,
  markers: EditorMarker[],
): AdPreviewPlayback {
  const [sessionSeed, setSessionSeed] = useState(generateSessionSeed);
  const [previewState, setPreviewState] = useState<AdPreviewState>({
    mode: "episode",
  });
  const [adProgressMs, setAdProgressMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const adVideoElements = useRef<Map<string, HTMLVideoElement>>(new Map());
  const triggeredMarkerIds = useRef(new Set<string>());
  const lastEpisodeTimeMs = useRef(0);

  const resolutions = useMemo(
    () => buildPreviewResolutions(markers, sessionSeed),
    [markers, sessionSeed],
  );

  const preloadUrls = useMemo(() => {
    const urls = new Set<string>();
    for (const resolution of resolutions.values()) {
      urls.add(resolution.resolvedAd.media.url);
    }
    return [...urls];
  }, [resolutions]);

  const activeAdUrl =
    previewState.mode === "ad" ? previewState.ad.media.url : null;

  const registerAdVideoRef = useCallback(
    (url: string, el: HTMLVideoElement | null) => {
      if (el) {
        adVideoElements.current.set(url, el);
      } else {
        adVideoElements.current.delete(url);
      }
    },
    [],
  );

  const resumeEpisode = useCallback(
    (resumeMs: number) => {
      setPreviewState({ mode: "episode" });
      engine.seek(resumeMs + 1);
      engine.play();
    },
    [engine],
  );

  useEffect(() => {
    if (previewState.mode === "ad") {
      return;
    }

    const tolerance = 300;
    const previousTimeMs = lastEpisodeTimeMs.current;

    if (engine.currentTimeMs < previousTimeMs - tolerance) {
      triggeredMarkerIds.current = new Set(
        markers
          .filter(
            (marker) =>
              triggeredMarkerIds.current.has(marker.id) &&
              marker.startMs < engine.currentTimeMs - tolerance,
          )
          .map((marker) => marker.id),
      );
    }

    lastEpisodeTimeMs.current = engine.currentTimeMs;
  }, [engine.currentTimeMs, markers, previewState.mode]);

  useEffect(() => {
    if (!engine.isPlaying || previewState.mode === "ad") return;

    const tolerance = 300;

    for (const marker of markers) {
      if (triggeredMarkerIds.current.has(marker.id)) continue;

      if (Math.abs(engine.currentTimeMs - marker.startMs) <= tolerance) {
        const resolution = resolutions.get(marker.id);
        if (!resolution) continue;

        triggeredMarkerIds.current.add(marker.id);
        engine.pause();

        const resumeTimeMs = marker.startMs;
        const adUrl = resolution.resolvedAd.media.url;

        setPreviewState({
          mode: "ad",
          markerId: marker.id,
          ad: resolution.resolvedAd,
          resumeTimeMs,
        });

        const adVideo = adVideoElements.current.get(adUrl);
        if (adVideo) {
          adVideo.currentTime = 0;
          adVideo.play().catch(() => {});
          setIsPlaying(true);
        }
        break;
      }
    }
  }, [
    engine.currentTimeMs,
    engine.isPlaying,
    markers,
    resolutions,
    previewState.mode,
    engine,
  ]);

  useEffect(() => {
    if (previewState.mode !== "ad") {
      setAdProgressMs(0);
      setIsPlaying(false);
      return;
    }

    const adVideo = adVideoElements.current.get(previewState.ad.media.url);
    if (!adVideo) return;

    const onTimeUpdate = () => {
      setAdProgressMs(Math.round(adVideo.currentTime * 1000));
    };
    const onPlay = () => {
      setIsPlaying(true);
    };
    const onPause = () => {
      setIsPlaying(false);
    };

    setIsPlaying(!adVideo.paused);
    adVideo.addEventListener("timeupdate", onTimeUpdate);
    adVideo.addEventListener("play", onPlay);
    adVideo.addEventListener("pause", onPause);
    return () => {
      adVideo.removeEventListener("timeupdate", onTimeUpdate);
      adVideo.removeEventListener("play", onPlay);
      adVideo.removeEventListener("pause", onPause);
    };
  }, [previewState]);

  const onAdVideoEnded = useCallback(() => {
    if (previewState.mode !== "ad") return;
    setAdProgressMs(0);
    setIsPlaying(false);
    resumeEpisode(previewState.resumeTimeMs);
  }, [previewState, resumeEpisode]);

  const togglePlay = useCallback(() => {
    if (previewState.mode !== "ad") {
      return;
    }

    const adVideo = adVideoElements.current.get(previewState.ad.media.url);
    if (!adVideo) {
      return;
    }

    if (adVideo.paused) {
      adVideo.play().catch(() => {});
      setIsPlaying(true);
      return;
    }

    adVideo.pause();
    setIsPlaying(false);
  }, [previewState]);

  const resetSession = useCallback(() => {
    setSessionSeed(generateSessionSeed());
    setPreviewState({ mode: "episode" });
    triggeredMarkerIds.current.clear();
    lastEpisodeTimeMs.current = 0;
  }, []);

  return {
    previewState,
    adProgressMs,
    isPlaying,
    preloadUrls,
    activeAdUrl,
    registerAdVideoRef,
    onAdVideoEnded,
    togglePlay,
    resolutions,
    sessionSeed,
    resetSession,
  };
}
