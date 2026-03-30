"use client";

export function EpisodeHeader({ episodeId }: { episodeId: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight leading-tight">
        Episode {episodeId}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Loading episode details...
      </p>
    </div>
  );
}
