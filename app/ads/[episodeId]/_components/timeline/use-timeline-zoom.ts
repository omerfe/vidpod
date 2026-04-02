import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  centeredScrollLeftForPercent,
  MAX_ZOOM,
  MIN_ZOOM,
  zoomIn,
  zoomOut,
} from "@/lib/ads/timeline-math";

interface UseTimelineZoomParams {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  clientXToExpandedPct: (clientX: number) => number;
  playheadPct: number;
}

export function useTimelineZoom({
  scrollRef,
  clientXToExpandedPct,
  playheadPct,
}: UseTimelineZoomParams) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const pendingZoomAnchorPctRef = useRef<number | null>(null);

  const setZoomAnchored = useCallback((nextZoom: number, anchorPct: number) => {
    setZoom((previousZoom) => {
      if (previousZoom === nextZoom) {
        return previousZoom;
      }

      pendingZoomAnchorPctRef.current = anchorPct;
      return nextZoom;
    });
  }, []);

  const handleZoomSlider = useCallback(
    (values: number[]) => {
      const fraction = (values[0] ?? 0) / 100;
      const nextZoom = MIN_ZOOM + fraction * (MAX_ZOOM - MIN_ZOOM);
      setZoomAnchored(nextZoom, playheadPct);
    },
    [playheadPct, setZoomAnchored],
  );

  const zoomSliderValue = ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      event.preventDefault();

      const anchorPct = clientXToExpandedPct(event.clientX);
      setZoom((currentZoom) => {
        const nextZoom =
          event.deltaY < 0 ? zoomIn(currentZoom) : zoomOut(currentZoom);
        if (nextZoom === currentZoom) {
          return currentZoom;
        }

        pendingZoomAnchorPctRef.current = anchorPct;
        return nextZoom;
      });
    }

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [clientXToExpandedPct, scrollRef]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    const anchorPct = pendingZoomAnchorPctRef.current;
    if (zoom < MIN_ZOOM || !element || anchorPct === null) {
      return;
    }

    pendingZoomAnchorPctRef.current = null;
    element.scrollLeft = centeredScrollLeftForPercent(
      anchorPct,
      element.scrollWidth,
      element.clientWidth,
    );
  }, [scrollRef, zoom]);

  return {
    zoom,
    zoomSliderValue,
    handleZoomSlider,
  };
}
