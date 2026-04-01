"use client";

import { useMutation } from "convex/react";
import { UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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

interface UploadEpisodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadEpisodeDialog({
  open,
  onOpenChange,
}: UploadEpisodeDialogProps) {
  const router = useRouter();
  const { state: uploadState, upload, reset } = useVideoUpload();
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const createEpisode = useMutation(api.uploads.createEpisodeFromUpload);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
      await upload(file);
    },
    [upload, title],
  );

  const handleSave = useCallback(async () => {
    if (uploadState.status !== "done" || !title.trim()) return;

    setIsSaving(true);
    try {
      const slug = await createEpisode({
        storageId: uploadState.storageId,
        title: title.trim(),
        durationMs: uploadState.durationMs,
      });

      onOpenChange(false);
      reset();
      setTitle("");
      router.push(`/ads/${slug}`);
    } finally {
      setIsSaving(false);
    }
  }, [uploadState, title, createEpisode, onOpenChange, reset, router]);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset();
        setTitle("");
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
          <DialogTitle>Upload episode</DialogTitle>
          <DialogDescription>
            Upload a video to create a new episode in the editor.
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

          <div className="space-y-1.5">
            <label htmlFor="episode-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="episode-title"
              placeholder="e.g. Creator Workflow Deep Dive"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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
            disabled={!isDone || !title.trim() || isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Creating…" : "Create episode"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
