import { AdsEditorScreen } from "./_components/ads-editor-screen";

interface AdsPageProps {
  params: Promise<{ episodeId: string }>;
}

export default async function AdsPage({ params }: AdsPageProps) {
  const { episodeId } = await params;

  return <AdsEditorScreen episodeSlug={episodeId} />;
}
