"use client";

import { useEffect } from "react";
import { isInteractiveElement } from "@/lib/ads/playback-engine";
import type { PlaybackActions } from "./use-playback-engine";

interface KeyboardShortcutsOptions {
  togglePlay: PlaybackActions["togglePlay"];
  skipForward: PlaybackActions["skipForward"];
  skipBackward: PlaybackActions["skipBackward"];
  undo?: () => void;
  redo?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  togglePlay,
  skipForward,
  skipBackward,
  undo,
  redo,
  enabled = true,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (isInteractiveElement(e.target)) return;

      const isModKey = e.metaKey || e.ctrlKey;

      if (isModKey && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo?.();
        return;
      }

      if (isModKey && e.key === "z") {
        e.preventDefault();
        undo?.();
        return;
      }

      switch (e.code) {
        case "Space": {
          e.preventDefault();
          togglePlay();
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          skipForward();
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          skipBackward();
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, togglePlay, skipForward, skipBackward, undo, redo]);
}
