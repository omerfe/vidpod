import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { ResolvedMedia } from "./contracts";

export function resolveMediaRecord(
  mediaRecord: Doc<"mediaRecords">,
): ResolvedMedia {
  const url =
    mediaRecord.sourceType === "public"
      ? mediaRecord.publicPath
      : mediaRecord.cdnUrl;

  if (!url) {
    throw new ConvexError(
      `Media record "${mediaRecord.label}" is missing a playable URL`,
    );
  }

  return {
    id: mediaRecord._id,
    label: mediaRecord.label,
    kind: mediaRecord.kind,
    sourceType: mediaRecord.sourceType,
    url,
    mimeType: mediaRecord.mimeType,
    durationMs: mediaRecord.durationMs,
    posterUrl: mediaRecord.posterPath ?? null,
  };
}
