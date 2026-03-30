import { DotIcon } from "lucide-react";
import Link from "next/link";
import type { EditorEpisode } from "@/lib/ads/contracts";
import { formatPublishedAt } from "./ads-editor-utils";

interface EpisodeHeaderProps {
  episode: EditorEpisode;
}

export function EpisodeHeader({ episode }: EpisodeHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/"
        className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {"<"} Ads
      </Link>

      <h1 className="text-2xl font-bold tracking-tight leading-tight">
        {episode.title}
      </h1>

      <div className="flex flex-wrap items-center gap-px text-sm text-muted-foreground">
        <span>Episode {episode.episodeNumber}</span>
        <DotIcon className="size-4" />
        <span>{formatPublishedAt(episode.publishedAt)}</span>
      </div>
    </div>
  );
}
