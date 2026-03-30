import { Card, CardContent } from "@/components/ui/card";
import type { EditorEpisode } from "@/lib/ads/contracts";
import { PlayerControls } from "./player-controls";
import type { PlaybackEngine } from "./use-playback-engine";

interface PlayerPanelSlotProps {
  episode: EditorEpisode;
  engine: PlaybackEngine;
}

export function PlayerPanelSlot({ episode, engine }: PlayerPanelSlotProps) {
  return (
    <Card data-slot="player-panel">
      <CardContent className="flex flex-col gap-3">
        <video
          className="aspect-video w-full shrink-0 rounded-lg bg-black"
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

        <PlayerControls engine={engine} />
      </CardContent>
    </Card>
  );
}
