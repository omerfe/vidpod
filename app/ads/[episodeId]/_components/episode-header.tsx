"use client";

import { DotIcon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { EditorEpisode } from "@/lib/ads/contracts";
import { formatPublishedAt } from "./ads-editor-utils";
import { UploadEpisodeDialog } from "./upload-episode-dialog";

interface EpisodeHeaderProps {
  episode: EditorEpisode;
}

export function EpisodeHeader({ episode }: EpisodeHeaderProps) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {"<"} Ads
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setUploadOpen(true)}
        >
          <UploadIcon className="size-3.5" />
          Upload episode
        </Button>
      </div>

      <h1 className="text-2xl font-bold tracking-tight leading-tight">
        {episode.title}
      </h1>

      <div className="flex flex-wrap items-center gap-px text-sm text-muted-foreground">
        <span>Episode {episode.episodeNumber}</span>
        <DotIcon className="size-4" />
        <span>{formatPublishedAt(episode.publishedAt)}</span>
      </div>

      {uploadOpen ? (
        <UploadEpisodeDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      ) : null}
    </div>
  );
}
