"use client";

import {
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EditorAdAsset } from "@/lib/ads/contracts";
import { cn } from "@/lib/utils";
import { formatDuration } from "../ads-editor-utils";
import type { AdMarkerFormApi } from "./create-ad-marker-form-api";

export function AdLibraryPicker(props: {
  form: AdMarkerFormApi;
  filteredAds: EditorAdAsset[];
  selectedAsset: EditorAdAsset | undefined;
}) {
  const { form, filteredAds, selectedAsset } = props;

  return (
    <FieldSet>
      <FieldLegend variant="label">Ad library</FieldLegend>
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
        <form.Field name="selectedAssetId">
          {(field) => {
            const isInvalid = field.state.meta.errors.length > 0;

            return (
              <>
                <ScrollArea className="h-48 rounded-lg border border-border/60">
                  <div className="flex flex-col gap-1 p-2">
                    {filteredAds.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        No ads match this search.
                      </div>
                    ) : null}
                    {filteredAds.map((asset) => {
                      const isSelected = field.state.value === asset.id;

                      return (
                        <button
                          key={asset.id}
                          type="button"
                          data-slot="ad-picker-row"
                          data-selected={isSelected ? "true" : "false"}
                          className={cn(
                            "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-ring"
                              : "border-border/60 bg-background/60 hover:bg-muted/50",
                          )}
                          onClick={() => {
                            field.handleBlur();
                            field.handleChange(asset.id);
                          }}
                        >
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {asset.folder} · {asset.campaign}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </>
            );
          }}
        </form.Field>
        {selectedAsset ? (
          <div
            data-slot="selected-ad-summary"
            className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm"
          >
            <div className="text-xs font-medium text-muted-foreground">
              Selected creative
            </div>
            <div className="font-medium">{selectedAsset.name}</div>
            <div className="text-xs text-muted-foreground">
              {formatDuration(selectedAsset.durationMs)} · {selectedAsset.cta}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Choose one ad. The timeline and list will update after save.
          </p>
        )}
      </FieldGroup>
    </FieldSet>
  );
}
