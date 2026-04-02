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
  adVideoRef: React.RefObject<HTMLVideoElement | null>;
  bindAdVideoProps: {
    ref: React.RefObject<HTMLVideoElement | null>;
    onEnded: React.ReactEventHandler<HTMLVideoElement>;
  };
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
  const adVideoRef = useRef<HTMLVideoElement | null>(null);

  const triggeredMarkerIds = useRef(new Set<string>());

  const resolutions = useMemo(
    () => buildPreviewResolutions(markers, sessionSeed),
    [markers, sessionSeed],
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

        setPreviewState({
          mode: "ad",
          markerId: marker.id,
          ad: resolution.resolvedAd,
          resumeTimeMs,
        });

        const adVideo = adVideoRef.current;
        if (adVideo) {
          adVideo.src = resolution.resolvedAd.media.url;
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
    const adVideo = adVideoRef.current;
    if (!adVideo || previewState.mode !== "ad") {
      setAdProgressMs(0);
      return;
    }
    const onTimeUpdate = () => {
      setAdProgressMs(Math.round(adVideo.currentTime * 1000));
    };
    adVideo.addEventListener("timeupdate", onTimeUpdate);
    return () => adVideo.removeEventListener("timeupdate", onTimeUpdate);
  }, [previewState.mode]);

  const onAdEnded: React.ReactEventHandler<HTMLVideoElement> =
    useCallback(() => {
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
    adVideoRef,
    bindAdVideoProps: {
      ref: adVideoRef,
      onEnded: onAdEnded,
    },
    resolutions,
    sessionSeed,
    resetSession,
  };
}
