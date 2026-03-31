import { z } from "zod";
import { markerTypeValues } from "@/lib/ads/contracts";
import { normalizeMarkerStartMs } from "@/lib/ads/marker";

export const placementModeValues = ["playhead", "custom"] as const;

export type PlacementMode = (typeof placementModeValues)[number];

export function resolveMarkerStartMs(args: {
  placement: PlacementMode;
  customSeconds: string;
  playbackTimeMs: number;
  episodeDurationMs: number;
}): number {
  if (args.placement === "playhead") {
    return normalizeMarkerStartMs(args.playbackTimeMs, args.episodeDurationMs);
  }

  const parsedSeconds = Number.parseFloat(args.customSeconds);
  const rawStartMs = Number.isFinite(parsedSeconds)
    ? Math.round(parsedSeconds * 1000)
    : 0;

  return normalizeMarkerStartMs(rawStartMs, args.episodeDurationMs);
}

export const adMarkerFormSchema = z
  .object({
    step: z.union([z.literal(1), z.literal(2)]),
    markerType: z.enum(markerTypeValues),
    placement: z.enum(placementModeValues),
    customSeconds: z.string(),
    selectedAssetId: z.string().nullable(),
    selectedAssetIds: z.array(z.string()),
    search: z.string(),
    serverError: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.step !== 2) return;

    if (data.placement === "custom") {
      const parsedSeconds = Number.parseFloat(data.customSeconds);

      if (!Number.isFinite(parsedSeconds) || parsedSeconds < 0) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid time in seconds.",
          path: ["customSeconds"],
        });
      }
    }

    if (data.markerType === "static" && !data.selectedAssetId) {
      ctx.addIssue({
        code: "custom",
        message: "Select one ad from the library.",
        path: ["selectedAssetId"],
      });
    }

    if (data.markerType === "auto" && data.selectedAssetIds.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one candidate ad.",
        path: ["selectedAssetIds"],
      });
    }
  });

export type AdMarkerFormValues = z.infer<typeof adMarkerFormSchema>;

export function createAdMarkerFormDefaultValues(): AdMarkerFormValues {
  return {
    step: 1,
    markerType: "static",
    placement: "playhead",
    customSeconds: "",
    selectedAssetId: null,
    selectedAssetIds: [],
    search: "",
    serverError: "",
  };
}
