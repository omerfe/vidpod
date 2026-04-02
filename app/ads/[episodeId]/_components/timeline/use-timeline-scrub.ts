import { useCallback, useMemo, useRef, useState } from "react";
import type { AdPreviewPlayback } from "@/hooks/use-ad-preview-playback";
import {
  clientXToFraction,
  episodeTimeToExpandedPct,
  type TimelineSegment,
} from "@/lib/ads/timeline-math";

interface UseTimelineScrubParams {
  contentRef: React.RefObject<HTMLDivElement | null>;
  currentTimeMs: number;
  durationMs: number;
  expandedDurationMs: number;
  segments: TimelineSegment[];
  adPreview?: AdPreviewPlayback;
  seekFromClientX: (clientX: number) => void;
}

export function useTimelineScrub({
  contentRef,
  currentTimeMs,
  durationMs,
  expandedDurationMs,
  segments,
  adPreview,
  seekFromClientX,
}: UseTimelineScrubParams) {
  const isDraggingRef = useRef(false);
  const [scrubPctOverride, setScrubPctOverride] = useState<number | null>(null);

  const clientXToExpandedPct = useCallback(
    (clientX: number): number => {
      const content = contentRef.current;
      if (!content) {
        return 0;
      }

      const rect = content.getBoundingClientRect();
      return clientXToFraction(clientX, rect) * 100;
    },
    [contentRef],
  );

  const handleScrubStart = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      isDraggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setScrubPctOverride(clientXToExpandedPct(event.clientX));
      seekFromClientX(event.clientX);
    },
    [clientXToExpandedPct, seekFromClientX],
  );

  const handleScrubMove = useCallback(
    (event: React.PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      setScrubPctOverride(clientXToExpandedPct(event.clientX));
      seekFromClientX(event.clientX);
    },
    [clientXToExpandedPct, seekFromClientX],
  );

  const handleScrubEnd = useCallback(() => {
    isDraggingRef.current = false;
    setScrubPctOverride(null);
  }, []);

  const playheadPct = useMemo(() => {
    if (scrubPctOverride !== null) {
      return scrubPctOverride;
    }

    if (durationMs <= 0) {
      return 0;
    }

    const previewState = adPreview?.previewState;
    const previewAdProgressMs = adPreview?.adProgressMs ?? 0;
    if (previewState?.mode === "ad") {
      const adSegment = segments.find(
        (segment) =>
          segment.type === "ad" && segment.markerId === previewState.markerId,
      );
      if (adSegment) {
        const adFraction =
          adSegment.durationMs > 0
            ? previewAdProgressMs / adSegment.durationMs
            : 0;
        return (
          adSegment.startPct + Math.min(adFraction, 1) * adSegment.widthPct
        );
      }
    }

    return episodeTimeToExpandedPct(currentTimeMs, segments);
  }, [adPreview, currentTimeMs, durationMs, scrubPctOverride, segments]);

  const expandedCurrentTimeMs = useMemo(() => {
    return Math.round((playheadPct / 100) * expandedDurationMs);
  }, [expandedDurationMs, playheadPct]);

  return {
    clientXToExpandedPct,
    playheadPct,
    expandedCurrentTimeMs,
    handleScrubStart,
    handleScrubMove,
    handleScrubEnd,
  };
}
