"use client";

import { Check } from "lucide-react";
import {
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type AdLibraryGroup,
  groupAdLibraryByFolder,
} from "@/lib/ads/ad-selection-service";
import type { EditorAdAsset } from "@/lib/ads/contracts";
import { cn } from "@/lib/utils";
import { formatDuration } from "../ads-editor-utils";
import type { AdMarkerFormApi } from "./create-ad-marker-form-api";

export function AdLibraryMultiPicker(props: {
  form: AdMarkerFormApi;
  filteredAds: EditorAdAsset[];
  selectedIds: string[];
}) {
  const { form, filteredAds, selectedIds } = props;
  const groups = groupAdLibraryByFolder(filteredAds);

  return (
    <FieldSet>
      <FieldLegend variant="label">
        Candidate ads
        {selectedIds.length > 0 ? (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {selectedIds.length} selected
          </span>
        ) : null}
      </FieldLegend>
      <FieldGroup>
        <form.Field name="search">
          {(field) => (
            <Input
              placeholder="Search by name, campaign, or folder"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => {
                field.handleChange(event.target.value);
              }}
              aria-label="Search ads"
            />
          )}
        </form.Field>
        <form.Field name="selectedAssetIds">
          {(field) => {
            const isInvalid = field.state.meta.errors.length > 0;

            const toggleAsset = (assetId: string) => {
              const current = field.state.value;
              const next = current.includes(assetId)
                ? current.filter((id) => id !== assetId)
                : [...current, assetId];
              field.handleChange(next);
            };

            return (
              <>
                <ScrollArea className="h-56 rounded-lg border border-border/60">
                  <div className="flex flex-col gap-1 p-2">
                    {filteredAds.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        No ads match this search.
                      </div>
                    ) : (
                      <GroupedAdList
                        groups={groups}
                        selectedIds={selectedIds}
                        onToggle={toggleAsset}
                      />
                    )}
                  </div>
                </ScrollArea>
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </>
            );
          }}
        </form.Field>
        {selectedIds.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {selectedIds.map((id) => {
              const asset = filteredAds.find((a) => a.id === id);
              if (!asset) return null;
              return (
                <div
                  key={id}
                  className="rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium"
                >
                  {asset.name}
                  <span className="ml-1 text-muted-foreground">
                    {formatDuration(asset.durationMs)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select one or more candidate ads for auto resolution.
          </p>
        )}
      </FieldGroup>
    </FieldSet>
  );
}

function GroupedAdList(props: {
  groups: AdLibraryGroup[];
  selectedIds: string[];
  onToggle: (assetId: string) => void;
}) {
  const { groups, selectedIds, onToggle } = props;

  return (
    <>
      {groups.map((group) => (
        <div key={group.label}>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {group.label}
          </div>
          {group.assets.map((asset) => {
            const isSelected = selectedIds.includes(asset.id);
            return (
              <button
                key={asset.id}
                type="button"
                data-slot="ad-picker-row"
                data-selected={isSelected ? "true" : "false"}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-ring"
                    : "border-border/60 bg-background/60 hover:bg-muted/50",
                )}
                onClick={() => onToggle(asset.id)}
              >
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {isSelected ? <Check className="size-3" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {asset.campaign} · {formatDuration(asset.durationMs)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}
