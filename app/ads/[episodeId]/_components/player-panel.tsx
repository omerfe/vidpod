import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EditorEpisode, EditorMarker } from "@/lib/ads/contracts";
import { formatTimecode } from "./ads-editor-utils";

interface PlayerPanelSlotProps {
  episode: EditorEpisode;
  markers: EditorMarker[];
  onPlaybackTimeMs?: (ms: number) => void;
}

export function PlayerPanelSlot({
  episode,
  markers,
  onPlaybackTimeMs,
}: PlayerPanelSlotProps) {
  return (
    <Card
      data-slot="player-panel"
      className="border-0 ring-1 ring-foreground/10"
    >
      <CardContent className="flex flex-col gap-4 p-4">
        <video
          className="aspect-video w-full rounded-lg border border-border/60 bg-black"
          controls
          preload="metadata"
          src={episode.media.url}
          onTimeUpdate={(event) => {
            const ms = Math.round(event.currentTarget.currentTime * 1000);
            onPlaybackTimeMs?.(ms);
          }}
        >
          <track
            default
            kind="captions"
            label="English captions"
            src="/empty-captions.vtt"
            srcLang="en"
          />
        </video>

        <div className="flex flex-wrap gap-2">
          {markers.map((marker) => (
            <Badge key={marker.id} variant="outline">
              {formatTimecode(marker.startMs)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
