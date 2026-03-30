"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { EditorAdAsset } from "@/lib/ads/contracts";
import { CreateAdMarkerDialogSession } from "./create-ad-marker-dialog-session";

export type { AdMarkerFormValues } from "@/lib/ads/create-ad-marker-form";

export function CreateAdMarkerDialog({
  open,
  onOpenChange,
  episodeSlug,
  episodeDurationMs,
  adLibrary,
  playbackTimeMs,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeSlug: string;
  episodeDurationMs: number;
  adLibrary: EditorAdAsset[];
  playbackTimeMs: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        {open ? (
          <CreateAdMarkerDialogSession
            episodeSlug={episodeSlug}
            episodeDurationMs={episodeDurationMs}
            adLibrary={adLibrary}
            playbackTimeMs={playbackTimeMs}
            onRequestClose={() => {
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
