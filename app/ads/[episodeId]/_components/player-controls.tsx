import { Button } from "@/components/ui/button";
import {
  ChevronsLeft,
  ChevronsRight,
  FastForward,
  HistoryIcon,
  Pause,
  Play,
  Rewind,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useCallback } from "react";
import type { PlaybackEngine } from "./use-playback-engine";

interface PlayerControlsProps {
  engine: PlaybackEngine;
}

export function PlayerControls({ engine }: PlayerControlsProps) {
  const {
    isPlaying,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    jumpToStart,
    jumpToEnd,
    durationMs,
  } = engine;

  const rewind5s = useCallback(() => {
    seek(Math.max(0, engine.currentTimeMs - 5_000));
  }, [seek, engine.currentTimeMs]);

  const forward5s = useCallback(() => {
    seek(Math.min(durationMs, engine.currentTimeMs + 5_000));
  }, [seek, durationMs, engine.currentTimeMs]);

  return (
    <div className="flex items-center justify-between gap-1 p-2 rounded-lg border">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={jumpToStart}
          className="rounded-full"
        >
          <SkipBack />
        </Button>
        Jump to start
      </div>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={skipBackward}
          aria-label="Skip backward 10 seconds"
        >
          <HistoryIcon />
          <span className="text-xs text-muted-foreground">10s</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={rewind5s}
          aria-label="Rewind"
        >
          <Rewind className="size-4 fill-current" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 translate-x-px fill-current" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={forward5s}
          aria-label="Fast forward"
        >
          <FastForward className="size-4 fill-current" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={skipForward}
          aria-label="Skip forward 10 seconds"
        >
          <span className="text-xs text-muted-foreground">10s</span>
          <HistoryIcon className="scale-x-[-1]" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        Jump to end
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={jumpToEnd}
          className="rounded-full"
        >
          <SkipForward className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
