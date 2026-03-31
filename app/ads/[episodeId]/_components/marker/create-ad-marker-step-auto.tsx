"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { EditorAdAsset } from "@/lib/ads/contracts";
import type { PlacementMode } from "@/lib/ads/create-ad-marker-form";
import { formatTimecode } from "../ads-editor-utils";
import { AdLibraryMultiPicker } from "./ad-library-multi-picker";
import type { AdMarkerFormApi } from "./create-ad-marker-form-api";

export function CreateAdMarkerStepAuto(props: {
  form: AdMarkerFormApi;
  playbackTimeMs: number;
  resolvedStartMs: number;
  filteredAds: EditorAdAsset[];
  selectedAssetIds: string[];
  placementIsCustom: boolean;
}) {
  const {
    form,
    playbackTimeMs,
    resolvedStartMs,
    filteredAds,
    selectedAssetIds,
    placementIsCustom,
  } = props;

  return (
    <>
      <FieldSet>
        <FieldLegend variant="label">Placement</FieldLegend>
        <FieldGroup>
          <form.Field name="placement">
            {(field) => (
              <RadioGroup
                value={field.state.value}
                onValueChange={(value) => {
                  field.handleChange(value as PlacementMode);
                }}
              >
                <Field orientation="horizontal">
                  <RadioGroupItem
                    value="playhead"
                    id="auto-placement-playhead"
                  />
                  <FieldLabel htmlFor="auto-placement-playhead">
                    <span className="font-medium">Current playhead</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {formatTimecode(playbackTimeMs)} → saves as{" "}
                      {formatTimecode(resolvedStartMs)}
                    </span>
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <RadioGroupItem value="custom" id="auto-placement-custom" />
                  <FieldLabel htmlFor="auto-placement-custom">
                    <span className="font-medium">Custom time</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      Enter position in seconds from the start of the episode
                    </span>
                  </FieldLabel>
                </Field>
              </RadioGroup>
            )}
          </form.Field>
          {placementIsCustom ? (
            <form.Field name="customSeconds">
              {(field) => {
                const isInvalid = field.state.meta.errors.length > 0;

                return (
                  <Field data-invalid={isInvalid} className="mt-2">
                    <FieldLabel htmlFor="auto-custom-seconds">
                      Seconds
                    </FieldLabel>
                    <Input
                      id="auto-custom-seconds"
                      inputMode="decimal"
                      placeholder="e.g. 5.5"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
                      aria-invalid={isInvalid}
                    />
                    <p className="text-xs text-muted-foreground">
                      Normalized position: {formatTimecode(resolvedStartMs)}
                    </p>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>
          ) : null}
        </FieldGroup>
      </FieldSet>

      <AdLibraryMultiPicker
        form={form}
        filteredAds={filteredAds}
        selectedIds={selectedAssetIds}
      />

      <p className="text-xs text-muted-foreground leading-relaxed">
        The system will deterministically resolve one ad from your candidate
        pool each preview session. All candidates remain eligible for future
        sessions.
      </p>
    </>
  );
}
