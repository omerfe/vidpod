import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AdPreviewPlayback } from "@/hooks/use-ad-preview-playback";
import type { PlaybackEngine } from "@/hooks/use-playback-engine";
import type { EditorEpisode } from "@/lib/ads/contracts";
import { PlayerControls } from "./player-controls";

interface PlayerPanelSlotProps {
  episode: EditorEpisode;
  engine: PlaybackEngine;
  adPreview: AdPreviewPlayback;
}

export function PlayerPanelSlot({
  episode,
  engine,
  adPreview,
}: PlayerPanelSlotProps) {
  const isShowingAd = adPreview.previewState.mode === "ad";

  return (
    <Card data-slot="player-panel">
      <CardContent className="flex flex-col gap-3">
        <div className="relative aspect-video w-full shrink-0 rounded-lg bg-black overflow-hidden">
          <video
            className={`absolute inset-0 size-full object-contain transition-opacity duration-200 ${isShowingAd ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            preload="metadata"
            src={episode.media.url}
            poster={episode.media.posterUrl ?? undefined}
            {...engine.bindVideoProps}
          >
            <track
              default
              kind="captions"
              label="English captions"
              src="/empty-captions.vtt"
              srcLang="en"
            />
          </video>

          <video
            className={`absolute inset-0 size-full object-contain transition-opacity duration-200 ${isShowingAd ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            preload="none"
            {...adPreview.bindAdVideoProps}
          >
            <track
              default
              kind="captions"
              label="English captions"
              src="/empty-captions.vtt"
              srcLang="en"
            />
          </video>

          {isShowingAd && adPreview.previewState.mode === "ad" ? (
            <div className="absolute top-3 left-3 z-10">
              <Badge
                variant="secondary"
                className="bg-foreground/80 text-background backdrop-blur-sm"
              >
                Ad: {adPreview.previewState.ad.name}
              </Badge>
            </div>
          ) : null}
        </div>

        <PlayerControls engine={engine} />
      </CardContent>
    </Card>
  );
}
