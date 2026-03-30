"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { EpisodeHeader } from "./episode-header";
import { MarkerPanelSlot } from "./marker-panel";
import { PlayerPanelSlot } from "./player-panel";
import { TimelinePanelSlot } from "./timeline-panel";

export function AdsEditorScreen({ episodeSlug }: { episodeSlug: string }) {
  const editorData = useQuery(api.ads.getEpisodeEditorData, {
    episodeSlug,
  });
  const episodes = useQuery(api.ads.listEpisodes, {});

  if (editorData === undefined || episodes === undefined) {
    return <LoadingState />;
  }

  if (editorData === null) {
    if (episodes.length === 0) {
      return (
        <StateCard
          title="No episodes available"
          description="No episodes are currently available in Convex for the ads editor."
        />
      );
    }

    return (
      <StateCard
        title="Episode not found"
        description={`The slug "${episodeSlug}" does not match any available episode.`}
      >
        <div className="flex flex-wrap gap-2">
          {episodes.map((episode) => (
            <Button asChild key={episode.slug} variant="outline">
              <Link href={`/ads/${episode.slug}`}>{episode.title}</Link>
            </Button>
          ))}
        </div>
      </StateCard>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-4">
        <div className="mb-4">
          <Button asChild size="sm" variant="ghost">
            <Link href="/">Ads</Link>
          </Button>
        </div>

        <EpisodeHeader episode={editorData.episode} stats={editorData.stats} />
      </div>

      <div className="flex-1 min-h-0 px-8 pb-4 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 h-full">
        <MarkerPanelSlot markers={editorData.markers} />
        <PlayerPanelSlot
          episode={editorData.episode}
          markers={editorData.markers}
        />
        <TimelinePanelSlot
          episode={editorData.episode}
          markers={editorData.markers}
        />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <StateCard
      title="Loading ads editor"
      description="Fetching episode metadata, markers, ad library entries, and resolved media."
    />
  );
}

function StateCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="w-full max-w-xl border-0 ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children ? <CardContent>{children}</CardContent> : null}
      </Card>
    </div>
  );
}
