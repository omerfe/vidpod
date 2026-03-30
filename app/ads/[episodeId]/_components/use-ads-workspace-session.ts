"use client";

import { convexQuery, useConvexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import type { EpisodeEditorData, EpisodeListItem } from "@/lib/ads/contracts";

export type AdsWorkspaceSession =
  | {
      status: "loading";
      episodeSlug: string;
    }
  | {
      status: "no-episodes";
      episodeSlug: string;
    }
  | {
      status: "missing-episode";
      episodeSlug: string;
      episodes: EpisodeListItem[];
    }
  | {
      status: "ready";
      episodeSlug: string;
      editorData: EpisodeEditorData;
      episodes: EpisodeListItem[];
    };

export function useAdsWorkspaceSession(
  episodeSlug: string,
): AdsWorkspaceSession {
  const editorData = useConvexQuery(api.ads.getEpisodeEditorData, {
    episodeSlug,
  });
  const episodesQuery = useQuery({
    ...convexQuery(api.ads.listEpisodes, {}),
    gcTime: 5 * 60 * 1000,
  });

  if (editorData === undefined || episodesQuery.data === undefined) {
    return {
      status: "loading",
      episodeSlug,
    };
  }

  const episodes = episodesQuery.data;

  if (editorData === null && episodes.length === 0) {
    return {
      status: "no-episodes",
      episodeSlug,
    };
  }

  if (editorData === null) {
    return {
      status: "missing-episode",
      episodeSlug,
      episodes,
    };
  }

  return {
    status: "ready",
    episodeSlug,
    editorData,
    episodes,
  };
}
