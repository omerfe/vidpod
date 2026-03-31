"use client";

import { useState } from "react";
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
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep(1);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          step === 2
            ? "sm:max-w-4xl"
            : step === 3
              ? "sm:max-w-xl"
              : "sm:max-w-md"
        }
      >
        {open ? (
          <CreateAdMarkerDialogSession
            episodeSlug={episodeSlug}
            episodeDurationMs={episodeDurationMs}
            adLibrary={adLibrary}
            playbackTimeMs={playbackTimeMs}
            onStepChange={setStep}
            onRequestClose={() => {
              handleOpenChange(false);
            }}
            onMarkerCreated={onMarkerCreated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
