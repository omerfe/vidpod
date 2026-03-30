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
    <div className="flex items-center justify-between pb-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full w-5 h-5"
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
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full w-5 h-5"
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

      <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium tabular-nums text-foreground">
        {formatTimecodeHMS(currentTimeMs)}
      </div>

      <div className="flex items-center gap-2">
        <ZoomOutIcon className="size-3.5" />
        <Slider
          value={[zoomSliderValue]}
          min={0}
          max={100}
          step={1}
          onValueChange={onZoomSlider}
          className="w-28 cursor-pointer"
        />
        <ZoomInIcon className="size-3.5" />
      </div>
    </div>
  );
}
