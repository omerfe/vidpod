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
import { formatDuration, formatTimecode } from "../ads-editor-utils";
import { AdLibraryPicker } from "./ad-library-picker";
import type { AdMarkerFormApi } from "./create-ad-marker-form-api";

export function CreateAdMarkerStepStatic(props: {
  form: AdMarkerFormApi;
  playbackTimeMs: number;
  resolvedStartMs: number;
  filteredAds: EditorAdAsset[];
  selectedAsset: EditorAdAsset | undefined;
  placementIsCustom: boolean;
}) {
  const {
    form,
    playbackTimeMs,
    resolvedStartMs,
    filteredAds,
    selectedAsset,
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
                  <RadioGroupItem value="playhead" id="placement-playhead" />
                  <FieldLabel htmlFor="placement-playhead">
                    <span className="font-medium">Current playhead</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {formatTimecode(playbackTimeMs)} → saves as{" "}
                      {formatTimecode(resolvedStartMs)}
                    </span>
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <RadioGroupItem value="custom" id="placement-custom" />
                  <FieldLabel htmlFor="placement-custom">
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
                    <FieldLabel htmlFor="custom-seconds">Seconds</FieldLabel>
                    <Input
                      id="custom-seconds"
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
                      Normalized position: {formatTimecode(resolvedStartMs)} (
                      {formatDuration(resolvedStartMs)})
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

      <AdLibraryPicker
        form={form}
        filteredAds={filteredAds}
        selectedAsset={selectedAsset}
      />
    </>
  );
}
