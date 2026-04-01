"use client";

import { useMutation } from "convex/react";
import { UploadIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import { useVideoUpload } from "@/hooks/use-video-upload";

interface UploadAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdCreated?: () => void;
}

export function UploadAdDialog({
  open,
  onOpenChange,
  onAdCreated,
}: UploadAdDialogProps) {
  const { state: uploadState, upload, reset } = useVideoUpload();
  const [name, setName] = useState("");
  const [campaign, setCampaign] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const createAdAsset = useMutation(api.uploads.createAdAssetFromUpload);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
      await upload(file);
    },
    [upload, name],
  );

  const handleSave = useCallback(async () => {
    if (uploadState.status !== "done" || !name.trim()) return;

    setIsSaving(true);
    try {
      await createAdAsset({
        storageId: uploadState.storageId,
        name: name.trim(),
        campaign: campaign.trim() || "Uncategorized",
        durationMs: uploadState.durationMs,
      });

      onAdCreated?.();
      onOpenChange(false);
      reset();
      setName("");
      setCampaign("");
    } finally {
      setIsSaving(false);
    }
  }, [
    uploadState,
    name,
    campaign,
    createAdAsset,
    onAdCreated,
    onOpenChange,
    reset,
  ]);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset();
        setName("");
        setCampaign("");
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset],
  );

  const isUploading = uploadState.status === "uploading";
  const isDone = uploadState.status === "done";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload ad creative</DialogTitle>
          <DialogDescription>
            Upload a video file to add to the ad library.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {uploadState.status === "idle" || uploadState.status === "error" ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-8 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <UploadIcon className="size-8" />
              <span className="text-sm font-medium">
                Click to select a video file
              </span>
            </button>
          ) : null}

          {uploadState.status === "error" ? (
            <p className="text-sm text-destructive">{uploadState.message}</p>
          ) : null}

          {isUploading ? (
            <div className="space-y-2">
              <Progress value={uploadState.progress} />
              <p className="text-xs text-muted-foreground">Uploading…</p>
            </div>
          ) : null}

          {isDone ? (
            <p className="text-sm text-emerald-600">
              Upload complete ({Math.round(uploadState.durationMs / 1000)}s
              video)
            </p>
          ) : null}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="ad-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="ad-name"
                placeholder="e.g. Coffee Break Promo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ad-campaign" className="text-sm font-medium">
                Campaign
              </label>
              <Input
                id="ad-campaign"
                placeholder="e.g. Spring Sponsors"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isDone || !name.trim() || isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Saving…" : "Add to library"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
