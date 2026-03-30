import { ArrowLeft } from "lucide-react";
import { EpisodeHeader } from "./_components/episode-header";
import { MarkerPanelSlot } from "./_components/marker-panel";
import { PlayerPanelSlot } from "./_components/player-panel";
import { TimelinePanelSlot } from "./_components/timeline-panel";

interface AdsPageProps {
  params: Promise<{ episodeId: string }>;
}

export default async function AdsPage({ params }: AdsPageProps) {
  const { episodeId } = await params;

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-4">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Ads
        </button>

        <EpisodeHeader episodeId={episodeId} />
      </div>

      <div className="flex-1 min-h-0 px-8 pb-4 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 h-full">
        <MarkerPanelSlot />
        <PlayerPanelSlot />
        <TimelinePanelSlot />
      </div>
    </div>
  );
}
