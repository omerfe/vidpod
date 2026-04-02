import { useCallback, useRef, useState } from "react";
import type { EditorMarker } from "@/lib/ads/contracts";
import type { TimelineSegment } from "@/lib/ads/timeline-math";

export interface TimelineDragOverride {
  markerId: string;
  ms: number;
  leftPct: number;
}

interface MarkerDragState {
  markerId: string;
  initialStartMs: number;
  initialClientX: number;
  initialLeftPct: number;
}

interface UseTimelineMarkerDragParams {
  contentRef: React.RefObject<HTMLDivElement | null>;
  trackRef: React.RefObject<HTMLDivElement | null>;
  expandedDurationMs: number;
  markers: EditorMarker[];
  onMoveMarker?: (markerId: string, newStartMs: number) => void;
  seekFromClientX: (clientX: number) => void;
  segments: TimelineSegment[];
}

export function useTimelineMarkerDrag({
  contentRef,
  trackRef,
  expandedDurationMs,
  markers,
  onMoveMarker,
  seekFromClientX,
  segments,
}: UseTimelineMarkerDragParams) {
  const markerDragRef = useRef<MarkerDragState | null>(null);
  const [dragOverride, setDragOverride] = useState<TimelineDragOverride | null>(
    null,
  );

  const calculateDragOverride = useCallback(
    (
      clientX: number,
      dragState: MarkerDragState,
    ): TimelineDragOverride | null => {
      const content = contentRef.current;
      if (!content) {
        return null;
      }

      const contentWidth = content.getBoundingClientRect().width;
      if (
        !Number.isFinite(clientX) ||
        !Number.isFinite(dragState.initialClientX) ||
        !Number.isFinite(dragState.initialStartMs) ||
        !Number.isFinite(contentWidth) ||
        contentWidth <= 0
      ) {
        return null;
      }

      const deltaPixels = clientX - dragState.initialClientX;
      const msPerPixel = expandedDurationMs / contentWidth;
      const adjustedMs = Math.round(
        Math.max(0, dragState.initialStartMs + deltaPixels * msPerPixel),
      );
      const deltaPct = (deltaPixels / contentWidth) * 100;

      return {
        markerId: dragState.markerId,
        ms: adjustedMs,
        leftPct: dragState.initialLeftPct + deltaPct,
      };
    },
    [contentRef, expandedDurationMs],
  );

  const handleTrackPointerDown = useCallback(
    (event: React.PointerEvent) => {
      const gripElement = (event.target as HTMLElement).closest(
        "[data-drag-handle]",
      ) as HTMLElement | null;

      if (gripElement) {
        if (!onMoveMarker) {
          return;
        }

        const markerId = gripElement.dataset.markerId;
        if (!markerId) {
          return;
        }

        const marker = markers.find((candidate) => candidate.id === markerId);
        if (!marker) {
          return;
        }

        const adSegment = segments.find(
          (segment) => segment.type === "ad" && segment.markerId === markerId,
        );

        event.preventDefault();
        markerDragRef.current = {
          markerId,
          initialStartMs: marker.startMs,
          initialClientX: event.clientX,
          initialLeftPct: adSegment?.startPct ?? 0,
        };
        setDragOverride({
          markerId,
          ms: marker.startMs,
          leftPct: adSegment?.startPct ?? 0,
        });
        trackRef.current?.setPointerCapture(event.pointerId);
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      seekFromClientX(event.clientX);
    },
    [markers, onMoveMarker, seekFromClientX, segments, trackRef],
  );

  const handleTrackPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const dragState = markerDragRef.current;
      if (!dragState) {
        return;
      }

      const nextOverride = calculateDragOverride(event.clientX, dragState);
      if (!nextOverride) {
        return;
      }

      setDragOverride(nextOverride);
    },
    [calculateDragOverride],
  );

  const handleTrackPointerUp = useCallback(
    (event: React.PointerEvent) => {
      const dragState = markerDragRef.current;
      if (!dragState) {
        return;
      }

      markerDragRef.current = null;
      setDragOverride(null);

      const nextOverride =
        calculateDragOverride(event.clientX, dragState) ?? dragOverride;
      if (!nextOverride) {
        return;
      }

      if (nextOverride.ms !== dragState.initialStartMs) {
        onMoveMarker?.(dragState.markerId, nextOverride.ms);
      }
    },
    [calculateDragOverride, dragOverride, onMoveMarker],
  );

  return {
    dragOverride,
    handleTrackPointerDown,
    handleTrackPointerMove,
    handleTrackPointerUp,
  };
}
