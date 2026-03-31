import type { EditorAdAsset, EditorMarker } from "./contracts";

export type AdPreviewResolution = {
  marker: EditorMarker;
  resolvedAd: EditorAdAsset;
};

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function resolveAutoMarker(
  marker: EditorMarker,
  sessionSeed: string,
): EditorAdAsset | null {
  const candidates = marker.assignments
    .filter((a) => a.role === "auto_candidate")
    .map((a) => a.adAsset);

  if (candidates.length === 0) return null;

  const combinedSeed = `${marker.id}:${sessionSeed}`;
  const index = hashSeed(combinedSeed) % candidates.length;
  return candidates[index] ?? null;
}

export function pickRandomAdAsset(
  assets: EditorAdAsset[],
  random: () => number = Math.random,
): EditorAdAsset | null {
  if (assets.length === 0) {
    return null;
  }

  const index = Math.floor(random() * assets.length);
  return assets[index] ?? null;
}

export function buildPreviewResolutions(
  markers: EditorMarker[],
  sessionSeed: string,
): Map<string, AdPreviewResolution> {
  const resolutions = new Map<string, AdPreviewResolution>();

  for (const marker of markers) {
    let resolvedAd: EditorAdAsset | null = null;

    if (marker.type === "static") {
      const staticAssignment = marker.assignments.find(
        (a) => a.role === "static",
      );
      if (staticAssignment) {
        resolvedAd = staticAssignment.adAsset;
      }
    } else if (marker.type === "auto") {
      resolvedAd = resolveAutoMarker(marker, sessionSeed);
    } else if (marker.type === "ab_test") {
      const variants = marker.assignments.filter(
        (a) => a.role === "ab_variant",
      );
      if (variants.length > 0) {
        const combinedSeed = `${marker.id}:${sessionSeed}`;
        const index = hashSeed(combinedSeed) % variants.length;
        const variant = variants[index];
        if (variant) resolvedAd = variant.adAsset;
      }
    }

    if (resolvedAd) {
      resolutions.set(marker.id, { marker, resolvedAd });
    }
  }

  return resolutions;
}

export type AdLibraryGroup = {
  label: string;
  assets: EditorAdAsset[];
};

export function groupAdLibraryByFolder(
  assets: EditorAdAsset[],
): AdLibraryGroup[] {
  const groups = new Map<string, EditorAdAsset[]>();

  for (const asset of assets) {
    const existing = groups.get(asset.folder);
    if (existing) {
      existing.push(asset);
    } else {
      groups.set(asset.folder, [asset]);
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({ label, assets: items }));
}

export function groupAdLibraryByCampaign(
  assets: EditorAdAsset[],
): AdLibraryGroup[] {
  const groups = new Map<string, EditorAdAsset[]>();

  for (const asset of assets) {
    const existing = groups.get(asset.campaign);
    if (existing) {
      existing.push(asset);
    } else {
      groups.set(asset.campaign, [asset]);
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({ label, assets: items }));
}

export function generateSessionSeed(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function findNextMarkerForPreview(
  markers: EditorMarker[],
  currentTimeMs: number,
  resolutions: Map<string, AdPreviewResolution>,
): AdPreviewResolution | null {
  const sorted = [...markers].sort((a, b) => a.startMs - b.startMs);

  for (const marker of sorted) {
    if (marker.startMs > currentTimeMs) break;

    const tolerance = 250;
    if (Math.abs(marker.startMs - currentTimeMs) <= tolerance) {
      const resolution = resolutions.get(marker.id);
      if (resolution) return resolution;
    }
  }

  return null;
}
