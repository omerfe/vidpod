"use client";

import {
  ChevronRight,
  ChevronsUpDownIcon,
  DotIcon,
  FlaskConical,
  LibraryIcon,
  MoveRightIcon,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { groupAdLibraryByFolder } from "@/lib/ads/ad-selection-service";
import type { EditorAdAsset } from "@/lib/ads/contracts";
import { cn } from "@/lib/utils";
import { formatDuration } from "../ads-editor-utils";
import type { AdMarkerFormApi } from "./create-ad-marker-form-api";

type AbTestSortMode = "recent" | "name" | "duration";

const SORT_LABELS: Record<AbTestSortMode, string> = {
  recent: "Upload date",
  name: "Name",
  duration: "Duration",
};

function sortAssets(
  assets: EditorAdAsset[],
  mode: AbTestSortMode,
): EditorAdAsset[] {
  const next = [...assets];

  if (mode === "name") {
    return next.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (mode === "duration") {
    return next.sort((a, b) => b.durationMs - a.durationMs);
  }

  return next.sort((a, b) => b.slug.localeCompare(a.slug));
}

export function CreateAdMarkerStepAbTest(props: {
  form: AdMarkerFormApi;
  adLibrary: EditorAdAsset[];
  filteredAds: EditorAdAsset[];
  selectedAssetIds: string[];
}) {
  const { form, adLibrary, filteredAds, selectedAssetIds } = props;
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<AbTestSortMode>("recent");

  const groups = useMemo(() => {
    return groupAdLibraryByFolder(adLibrary);
  }, [adLibrary]);

  const visibleAds = useMemo(() => {
    const scopedAssets =
      activeFolder === "all"
        ? filteredAds
        : filteredAds.filter((asset) => asset.folder === activeFolder);

    return sortAssets(scopedAssets, sortMode);
  }, [activeFolder, filteredAds, sortMode]);

  const groupedVisibleAds = useMemo(() => {
    return new Map(
      groupAdLibraryByFolder(filteredAds).map((group) => [
        group.label,
        group.assets,
      ]),
    );
  }, [filteredAds]);

  return (
    <div className="grid min-h-120 md:grid-cols-[15rem_minmax(0,1fr)] border-y py-4">
      <aside className="border border-border/70 bg-muted rounded-lg p-4 space-y-6">
        <form.Field name="search">
          {(field) => (
            <InputGroup className="h-11 bg-background">
              <InputGroupInput
                aria-label="Search ads"
                placeholder="Search library..."
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
          )}
        </form.Field>
        <div className="flex items-center gap-2">
          <LibraryIcon className="size-4" />
          <h3 className="font-medium">Ad library</h3>
        </div>

        <ScrollArea className="h-56 md:h-100">
          <Collapsible open={libraryOpen} onOpenChange={setLibraryOpen}>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex size-6 items-center justify-center rounded-md hover:bg-muted"
                  aria-label={
                    libraryOpen ? "Collapse folder tree" : "Expand folder tree"
                  }
                >
                  <ChevronRight
                    className={cn(
                      "size-4 transition-transform",
                      libraryOpen ? "rotate-90" : "",
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                onClick={() => {
                  setActiveFolder("all");
                  setLibraryOpen(true);
                }}
              >
                <span className="truncate font-medium">All folders</span>
                <span className="text-xs text-muted-foreground">
                  {adLibrary.length}
                </span>
              </button>
            </div>

            <CollapsibleContent className="mt-2">
              <div className="ml-3 border-l border-border/70 pl-3">
                {groups.map((group) => {
                  const isExpanded = expandedFolders.includes(group.label);
                  const isActive = activeFolder === group.label;
                  const groupAssets =
                    groupedVisibleAds.get(group.label) ?? group.assets;

                  return (
                    <div key={group.label} className="pb-1">
                      <div
                        className={cn(
                          "rounded-xl border px-2 py-1.5 transition-colors",
                          isActive
                            ? "border-border bg-background"
                            : "border-transparent",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="flex size-6 items-center justify-center rounded-md hover:bg-muted"
                            onClick={() => {
                              setExpandedFolders((current) =>
                                current.includes(group.label)
                                  ? current.filter(
                                      (value) => value !== group.label,
                                    )
                                  : [...current, group.label],
                              );
                            }}
                            aria-label={
                              isExpanded
                                ? `Collapse ${group.label}`
                                : `Expand ${group.label}`
                            }
                          >
                            <ChevronRight
                              className={cn(
                                "size-4 transition-transform",
                                isExpanded ? "rotate-90" : "",
                              )}
                            />
                          </button>
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                            onClick={() => {
                              setActiveFolder(group.label);
                              setLibraryOpen(true);
                              setExpandedFolders((current) =>
                                current.includes(group.label)
                                  ? current
                                  : [...current, group.label],
                              );
                            }}
                          >
                            <span
                              className={cn(
                                "truncate text-sm",
                                isActive
                                  ? "font-medium text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {group.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {group.assets.length}
                            </span>
                          </button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="ml-3 mt-1 border-l border-border/60 pl-3">
                          {groupAssets.length > 0 ? (
                            groupAssets.map((asset) => (
                              <div
                                key={asset.id}
                                className="flex items-center gap-2 py-1 text-xs text-muted-foreground"
                              >
                                <DotIcon className="size-4" />
                                <span className="truncate">{asset.name}</span>
                              </div>
                            ))
                          ) : (
                            <div className="py-1 text-xs text-muted-foreground">
                              No matching ads
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </ScrollArea>
      </aside>

      <div className="flex min-h-0 flex-col">
        <div className="flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-end">
          <Select
            value={sortMode}
            onValueChange={(value) => {
              setSortMode(value as AbTestSortMode);
            }}
          >
            <SelectTrigger
              className="justify-between h-11! px-4!"
              showIcon={false}
            >
              <div className="flex items-center gap-2">
                <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Sort ads" />
              </div>
            </SelectTrigger>
            <SelectContent position="popper">
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <form.Field name="search">
            {(field) => (
              <InputGroup className="h-11 max-w-40">
                <InputGroupInput
                  aria-label="Search ads"
                  placeholder="Search ads..."
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
            )}
          </form.Field>
        </div>

        <form.Field name="selectedAssetIds">
          {(field) => {
            const toggleAsset = (assetId: string) => {
              const next = field.state.value.includes(assetId)
                ? field.state.value.filter((id) => id !== assetId)
                : [...field.state.value, assetId];
              field.handleChange(next);
            };

            return (
              <ScrollArea className="h-[60svh]">
                <div className="space-y-3 p-4">
                  {visibleAds.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                      No ads match the current folder and search filters.
                    </div>
                  ) : (
                    visibleAds.map((asset) => {
                      const isSelected = selectedAssetIds.includes(asset.id);

                      return (
                        <button
                          key={asset.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-4 rounded-2xl border px-3 pr-9 py-3 text-left transition-colors",
                            isSelected
                              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30"
                              : "border-border/70 hover:bg-muted/30",
                          )}
                          onClick={() => {
                            toggleAsset(asset.id);
                          }}
                        >
                          <div className="flex aspect-1.1/1 w-36 shrink-0 items-center justify-center rounded-xl">
                            {asset.media.posterUrl ? (
                              // biome-ignore lint/performance/noImgElement: This is a valid use case
                              <img
                                src={asset.media.posterUrl}
                                alt={asset.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-center w-full h-full">
                                <div className="flex size-9 items-center justify-center rounded-full bg-background shadow-xs">
                                  <FlaskConical className="size-4 text-muted-foreground" />
                                </div>
                                <span className="px-2 text-[11px] font-medium text-muted-foreground">
                                  {asset.folder}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5 flex-1">
                            <h5 className="font-bold text-base">
                              {asset.name}
                            </h5>

                            <div className="flex flex-wrap items-center gap-0.5 text-sm text-muted-foreground font-semibold">
                              <span>13/03/24 •</span>
                              <span>{formatDuration(asset.durationMs)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline">{asset.folder}</Badge>
                              <MoveRightIcon className="size-4" />
                              <Badge variant="outline">{asset.campaign}</Badge>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-primary",
                            )}
                            aria-hidden
                          >
                            {isSelected ? (
                              <span className="text-[11px] font-semibold">
                                ✓
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            );
          }}
        </form.Field>
      </div>
    </div>
  );
}
