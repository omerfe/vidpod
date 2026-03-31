"use client";

import { useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "@/convex/_generated/api";
import { pickRandomAdAsset } from "@/lib/ads/ad-selection-service";
import type { EditorAdAsset, MarkerType } from "@/lib/ads/contracts";
import {
  type AdMarkerFormValues,
  resolveMarkerStartMs,
} from "@/lib/ads/create-ad-marker-form";
import type { MarkerSnapshot } from "@/lib/ads/editor-history";
import type { AdMarkerCoreFormApi } from "./create-ad-marker-form-api";

export function useCreateAdMarkerSubmit(args: {
  episodeSlug: string;
  playbackTimeMs: number;
  episodeDurationMs: number;
  adLibrary: EditorAdAsset[];
  onRequestClose: () => void;
  onMarkerCreated?: (markerId: string, snapshot: MarkerSnapshot) => void;
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
      let markerType: MarkerType;
      let adAssetIds: Parameters<typeof createMarker>[0]["adAssetIds"];

      if (value.markerType === "static") {
        if (value.step !== 2) {
          return;
        }
        if (!value.selectedAssetId) return;
        markerType = "static";
        adAssetIds = [value.selectedAssetId] as typeof adAssetIds;
      } else if (value.markerType === "auto") {
        markerType = "auto";
        if (value.step === 2 && value.selectedAssetIds.length > 0) {
          adAssetIds = value.selectedAssetIds as unknown as typeof adAssetIds;
        } else {
          const randomAsset = pickRandomAdAsset(args.adLibrary);
          if (!randomAsset) {
            formApi.setFieldValue(
              "serverError",
              "No ads are available to create an auto marker.",
            );
            return;
          }
          adAssetIds = [randomAsset.id] as typeof adAssetIds;
        }
      } else {
        return;
      }

      formApi.setFieldValue("serverError", "");

      const startMs = resolveMarkerStartMs({
        placement: value.placement,
        customSeconds: value.customSeconds,
        playbackTimeMs: args.playbackTimeMs,
        episodeDurationMs: args.episodeDurationMs,
      });

      try {
        const result = await createMarker({
          episodeSlug: args.episodeSlug,
          markerType,
          startMs,
          adAssetIds,
        });
        args.onMarkerCreated?.(result.id, {
          episodeSlug: args.episodeSlug,
          markerType,
          startMs,
          label: result.label,
          notes: null,
          adAssetIds: adAssetIds.map(String),
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
      args.adLibrary,
      args.episodeDurationMs,
      args.onRequestClose,
      args.onMarkerCreated,
      args.playbackTimeMs,
      createMarker,
    ],
  );

  return { onSubmit };
}
