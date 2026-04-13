"use client";

import {
  RotateCcwIcon,
  RotateCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatTimecodeHMS } from "../ads-editor-utils";

interface TimelineToolbarProps {
  currentTimeMs: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  zoomSliderValue: number;
  onZoomSlider: (values: number[]) => void;
}

export function TimelineToolbar({
  currentTimeMs,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoomSliderValue,
  onZoomSlider,
}: TimelineToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 xl:px-8">
      <div className="flex items-center gap-4 xl:gap-12">
        <div className="flex items-center gap-1 xl:gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full w-5 h-5 xl:w-8 xl:h-8 bg-transparent"
            disabled={!canUndo}
            onClick={onUndo}
          >
            <RotateCcwIcon className="size-3" />
          </Button>
          <span
            className={canUndo ? "text-foreground" : "text-muted-foreground"}
          >
            Undo
          </span>
        </div>
        <div className="flex items-center gap-1 xl:gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full w-5 h-5 xl:w-8 xl:h-8 bg-transparent"
            disabled={!canRedo}
            onClick={onRedo}
          >
            <RotateCwIcon className="size-3" />
          </Button>
          <span
            className={canRedo ? "text-foreground" : "text-muted-foreground"}
          >
            Redo
          </span>
        </div>
      </div>

      <div className="rounded-md border border-border/60 h-10 font-semibold text-base px-3 py-2 tabular-nums text-zinc-500">
        {formatTimecodeHMS(currentTimeMs)}
      </div>

      <div className="flex items-center gap-4 xl:gap-6">
        <ZoomOutIcon className="size-4" />
        <Slider
          value={[zoomSliderValue]}
          min={0}
          max={100}
          step={1}
          onValueChange={onZoomSlider}
          className="w-28 cursor-pointer"
        />
        <ZoomInIcon className="size-4" />
      </div>
    </div>
  );
}
