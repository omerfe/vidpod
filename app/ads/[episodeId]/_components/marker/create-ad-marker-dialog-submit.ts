"use client";

import { useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "@/convex/_generated/api";
import {
  type AdMarkerFormValues,
  resolveMarkerStartMs,
} from "@/lib/ads/create-ad-marker-form";
import type { AdMarkerCoreFormApi } from "./create-ad-marker-form-api";

export function useCreateAdMarkerSubmit(args: {
  episodeSlug: string;
  playbackTimeMs: number;
  episodeDurationMs: number;
  onRequestClose: () => void;
}) {
  const createMarker = useMutation(api.ads.createMarker);

  const onSubmit = useCallback(
    async ({
      value,
      formApi,
    }: {
      value: AdMarkerFormValues;
      formApi: AdMarkerCoreFormApi;
    }) => {
      if (
        value.step !== 2 ||
        value.markerType !== "static" ||
        !value.selectedAssetId
      ) {
        return;
      }

      formApi.setFieldValue("serverError", "");

      const startMs = resolveMarkerStartMs({
        placement: value.placement,
        customSeconds: value.customSeconds,
        playbackTimeMs: args.playbackTimeMs,
        episodeDurationMs: args.episodeDurationMs,
      });
      const adAssetIds = [value.selectedAssetId] as Parameters<
        typeof createMarker
      >[0]["adAssetIds"];

      try {
        await createMarker({
          episodeSlug: args.episodeSlug,
          markerType: "static",
          startMs,
          adAssetIds,
        });
        args.onRequestClose();
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Could not create marker";
        formApi.setFieldValue("serverError", message);
      }
    },
    [
      args.episodeSlug,
      args.episodeDurationMs,
      args.onRequestClose,
      args.playbackTimeMs,
      createMarker,
    ],
  );

  return { onSubmit };
}
