import type { EditorAdAsset } from "@/lib/ads/contracts";

export function filterAdLibraryBySearch(
  adLibrary: EditorAdAsset[],
  search: string,
): EditorAdAsset[] {
  const q = search.trim().toLowerCase();

  if (!q) {
    return adLibrary;
  }

  return adLibrary.filter((asset) => {
    const haystack = [asset.name, asset.campaign, asset.folder, asset.slug]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}
