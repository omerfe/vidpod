"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { EditorAdAsset } from "@/lib/ads/contracts";
import type { MarkerSnapshot } from "@/lib/ads/editor-history";
import { CreateAdMarkerDialogSession } from "./create-ad-marker-dialog-session";

export type { AdMarkerFormValues } from "@/lib/ads/create-ad-marker-form";

export function CreateAdMarkerDialog({
  open,
  onOpenChange,
  episodeSlug,
  episodeDurationMs,
  adLibrary,
  playbackTimeMs,
  onMarkerCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeSlug: string;
  episodeDurationMs: number;
  adLibrary: EditorAdAsset[];
  playbackTimeMs: number;
  onMarkerCreated?: (markerId: string, snapshot: MarkerSnapshot) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <CreateAdMarkerDialogSession
            episodeSlug={episodeSlug}
            episodeDurationMs={episodeDurationMs}
            adLibrary={adLibrary}
            playbackTimeMs={playbackTimeMs}
            onRequestClose={() => {
              onOpenChange(false);
            }}
            onMarkerCreated={onMarkerCreated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
