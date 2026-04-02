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
  preloadUrls: string[];
  activeAdUrl: string | null;
  registerAdVideoRef: (url: string, el: HTMLVideoElement | null) => void;
  onAdVideoEnded: () => void;
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
  const adVideoElements = useRef<Map<string, HTMLVideoElement>>(new Map());

  const triggeredMarkerIds = useRef(new Set<string>());

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
      return;
    }

    const adVideo = adVideoElements.current.get(previewState.ad.media.url);
    if (!adVideo) return;

    const onTimeUpdate = () => {
      setAdProgressMs(Math.round(adVideo.currentTime * 1000));
    };
    adVideo.addEventListener("timeupdate", onTimeUpdate);
    return () => adVideo.removeEventListener("timeupdate", onTimeUpdate);
  }, [previewState]);

  const onAdVideoEnded = useCallback(() => {
    if (previewState.mode !== "ad") return;
    setAdProgressMs(0);
    resumeEpisode(previewState.resumeTimeMs);
  }, [previewState, resumeEpisode]);

  const resetSession = useCallback(() => {
    setSessionSeed(generateSessionSeed());
    setPreviewState({ mode: "episode" });
    triggeredMarkerIds.current.clear();
  }, []);

  return {
    previewState,
    adProgressMs,
    preloadUrls,
    activeAdUrl,
    registerAdVideoRef,
    onAdVideoEnded,
    resolutions,
    sessionSeed,
    resetSession,
  };
}
