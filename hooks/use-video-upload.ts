"use client";

import { useMutation } from "convex/react";
import { useCallback, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "done"; storageId: Id<"_storage">; durationMs: number }
  | { status: "error"; message: string };

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const ms = Math.round(video.duration * 1000);
      URL.revokeObjectURL(video.src);
      resolve(ms);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Could not read video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
}

export function useVideoUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl);

  const upload = useCallback(
    async (
      file: File,
    ): Promise<{ storageId: Id<"_storage">; durationMs: number } | null> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setState({ status: "uploading", progress: 0 });

        const [uploadUrl, durationMs] = await Promise.all([
          generateUploadUrl(),
          getVideoDuration(file),
        ]);

        if (controller.signal.aborted) return null;
        setState({ status: "uploading", progress: 30 });

        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const { storageId } = (await response.json()) as {
          storageId: Id<"_storage">;
        };

        setState({ status: "done", storageId, durationMs });
        return { storageId, durationMs };
      } catch (err) {
        if (controller.signal.aborted) return null;
        const message = err instanceof Error ? err.message : "Upload failed";
        setState({ status: "error", message });
        return null;
      }
    },
    [generateUploadUrl],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle" });
  }, []);

  return { state, upload, reset };
}
