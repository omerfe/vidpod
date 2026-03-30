import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { EpisodeListItem } from "@/convex/lib/contracts";

interface EpisodeWorkspaceSwitcherProps {
  currentEpisodeSlug: string;
  episodes: EpisodeListItem[];
}

export function EpisodeWorkspaceSwitcher({
  currentEpisodeSlug,
  episodes,
}: EpisodeWorkspaceSwitcherProps) {
  if (episodes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {episodes.map((episode) => (
        <Button
          asChild
          key={episode.slug}
          size="sm"
          variant={episode.slug === currentEpisodeSlug ? "default" : "outline"}
        >
          <Link href={`/ads/${episode.slug}`}>{episode.title}</Link>
        </Button>
      ))}
    </div>
  );
}
