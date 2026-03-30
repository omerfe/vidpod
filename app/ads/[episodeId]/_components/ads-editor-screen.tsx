"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EpisodeHeader } from "./episode-header";
import { EpisodeWorkspaceSwitcher } from "./episode-workspace-switcher";
import { MarkerPanelSlot } from "./marker/marker-panel";
import { PlayerPanelSlot } from "./player-panel";
import { TimelinePanelSlot } from "./timeline-panel";
import { useAdsWorkspaceSession } from "./use-ads-workspace-session";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
import { usePlaybackEngine } from "./use-playback-engine";

export function AdsEditorScreen({ episodeSlug }: { episodeSlug: string }) {
  const session = useAdsWorkspaceSession(episodeSlug);

  if (session.status === "loading") {
    return <LoadingState />;
  }

  if (session.status === "no-episodes") {
    return (
      <StateCard
        title="No episodes available"
        description="No episodes are currently available in Convex for the ads editor."
      />
    );
  }

  if (session.status === "missing-episode") {
    return (
      <StateCard
        title="Episode not found"
        description={`The slug "${episodeSlug}" does not match any available episode.`}
      >
        <EpisodeWorkspaceSwitcher
          currentEpisodeSlug={episodeSlug}
          episodes={session.episodes}
        />
      </StateCard>
    );
  }

  return (
    <ReadyWorkspace episodeSlug={episodeSlug} editorData={session.editorData} />
  );
}

function ReadyWorkspace({
  episodeSlug,
  editorData,
}: {
  episodeSlug: string;
  editorData: NonNullable<
    Extract<
      ReturnType<typeof useAdsWorkspaceSession>,
      { status: "ready" }
    >["editorData"]
  >;
}) {
  const engine = usePlaybackEngine(editorData.episode.durationMs);

  useKeyboardShortcuts({
    togglePlay: engine.togglePlay,
    skipForward: engine.skipForward,
    skipBackward: engine.skipBackward,
  });

  return (
    <div className="flex min-h-full flex-col px-8 py-6 gap-6">
      <EpisodeHeader episode={editorData.episode} />

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
        <MarkerPanelSlot
          episodeSlug={episodeSlug}
          episodeDurationMs={editorData.episode.durationMs}
          adLibrary={editorData.adLibrary}
          markers={editorData.markers}
          playbackTimeMs={engine.currentTimeMs}
        />
        <PlayerPanelSlot episode={editorData.episode} engine={engine} />
        <TimelinePanelSlot markers={editorData.markers} engine={engine} />
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
