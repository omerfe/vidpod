import { Badge } from "@/components/ui/badge";
import type { EditorEpisode, EpisodeEditorStats } from "@/convex/lib/contracts";
import { formatDuration, formatPublishedAt } from "./ads-editor-utils";

interface EpisodeHeaderProps {
  episode: EditorEpisode;
  stats: EpisodeEditorStats;
}

export function EpisodeHeader({ episode, stats }: EpisodeHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Episode {episode.episodeNumber}</Badge>
        <Badge variant="outline">
          {formatPublishedAt(episode.publishedAt)}
        </Badge>
        <Badge variant="outline">{formatDuration(episode.durationMs)}</Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight leading-tight">
          {episode.title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {episode.description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{stats.totalMarkers} markers</span>
        <span>{stats.staticMarkers} static</span>
        <span>{stats.autoMarkers} auto</span>
        <span>{stats.abTestMarkers} A/B tests</span>
      </div>
    </div>
  );
}
