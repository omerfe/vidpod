"use client";

import { useEffect, useState } from "react";

export type WaveformState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; peaks: number[] }
  | { status: "error"; error: string };

const cache = new Map<string, number[]>();

function extractPeaks(audioBuffer: AudioBuffer, barCount: number): number[] {
  const channel = audioBuffer.getChannelData(0);
  const samplesPerBar = Math.floor(channel.length / barCount);
  const peaks: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * samplesPerBar;
    const end = Math.min(start + samplesPerBar, channel.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channel[j] ?? 0);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }

  const globalMax = Math.max(...peaks, 0.001);
  return peaks.map((p) => p / globalMax);
}

export function useAudioWaveform(
  videoUrl: string | undefined,
  barCount: number,
): WaveformState {
  const [state, setState] = useState<WaveformState>({ status: "idle" });

  useEffect(() => {
    if (!videoUrl) {
      setState({ status: "idle" });
      return;
    }

    const cached = cache.get(videoUrl);
    if (cached) {
      setState({ status: "ready", peaks: cached });
      return;
    }

    const url = videoUrl;
    let cancelled = false;
    const controller = new AbortController();

    async function decode() {
      setState({ status: "loading" });

      try {
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Fetch failed: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (cancelled) return;

        const audioCtx = new AudioContext();
        try {
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          if (cancelled) return;

          const peaks = extractPeaks(audioBuffer, barCount);
          cache.set(url, peaks);
          setState({ status: "ready", peaks });
        } finally {
          await audioCtx.close();
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Waveform decode failed";
        if (message.includes("abort")) return;
        setState({ status: "error", error: message });
      }
    }

    void decode();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [videoUrl, barCount]);

  return state;
}
