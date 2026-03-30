"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { CircleDashed, Crosshair, FlaskConical } from "lucide-react";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import {
  type EditorAdAsset,
  type MarkerType,
  markerTypeValues,
} from "@/lib/ads/contracts";
import { normalizeMarkerStartMs } from "@/lib/ads/marker";
import { cn } from "@/lib/utils";
import { formatDuration, formatTimecode } from "./ads-editor-utils";

const placementModeValues = ["playhead", "custom"] as const;

type PlacementMode = (typeof placementModeValues)[number];

function resolveMarkerStartMs(args: {
  placement: PlacementMode;
  customSeconds: string;
  playbackTimeMs: number;
  episodeDurationMs: number;
}) {
  if (args.placement === "playhead") {
    return normalizeMarkerStartMs(args.playbackTimeMs, args.episodeDurationMs);
  }

  const parsedSeconds = Number.parseFloat(args.customSeconds);
  const rawStartMs = Number.isFinite(parsedSeconds)
    ? Math.round(parsedSeconds * 1000)
    : 0;

  return normalizeMarkerStartMs(rawStartMs, args.episodeDurationMs);
}

const adMarkerFormSchema = z
  .object({
    step: z.union([z.literal(1), z.literal(2)]),
    markerType: z.enum(markerTypeValues),
    placement: z.enum(placementModeValues),
    customSeconds: z.string(),
    selectedAssetId: z.string().nullable(),
    search: z.string(),
    serverError: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.step !== 2 || data.markerType !== "static") {
      return;
    }

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

    if (!data.selectedAssetId) {
      ctx.addIssue({
        code: "custom",
        message: "Select one ad from the library.",
        path: ["selectedAssetId"],
      });
    }
  });

export type AdMarkerFormValues = z.infer<typeof adMarkerFormSchema>;

function createAdMarkerFormDefaultValues(): AdMarkerFormValues {
  return {
    step: 1,
    markerType: "static",
    placement: "playhead",
    customSeconds: "",
    selectedAssetId: null,
    search: "",
    serverError: "",
  };
}

const TYPE_ROWS: {
  value: MarkerType;
  title: string;
  description: string;
  Icon: typeof CircleDashed;
}[] = [
  {
    value: "auto",
    title: "Auto",
    description: "Automatic ad insertions",
    Icon: CircleDashed,
  },
  {
    value: "static",
    title: "Static",
    description: "A marker for a specific ad that you select",
    Icon: Crosshair,
  },
  {
    value: "ab_test",
    title: "A/B test",
    description: "Compare the performance of multiple ads",
    Icon: FlaskConical,
  },
];

export function CreateAdMarkerDialog({
  open,
  onOpenChange,
  episodeSlug,
  episodeDurationMs,
  adLibrary,
  playbackTimeMs,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeSlug: string;
  episodeDurationMs: number;
  adLibrary: EditorAdAsset[];
  playbackTimeMs: number;
}) {
  const createMarker = useMutation(api.ads.createMarker);

  const form = useForm({
    defaultValues: createAdMarkerFormDefaultValues(),
    validators: {
      onSubmit: adMarkerFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      if (
        value.step !== 2 ||
        value.markerType !== "static" ||
        !value.selectedAssetId
      ) {
        return;
      }

      formApi.setFieldValue("serverError", "");

      const startMs = resolveMarkerStartMs({
        placement: value.placement,
        customSeconds: value.customSeconds,
        playbackTimeMs,
        episodeDurationMs,
      });
      const adAssetIds = [value.selectedAssetId] as Parameters<
        typeof createMarker
      >[0]["adAssetIds"];

      try {
        await createMarker({
          episodeSlug,
          markerType: "static",
          startMs,
          adAssetIds,
        });
        onOpenChange(false);
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Could not create marker";
        formApi.setFieldValue("serverError", message);
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [form, open]);

  const values = useStore(form.store, (state) => state.values);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const resolvedStartMs = useMemo(() => {
    return resolveMarkerStartMs({
      placement: values.placement,
      customSeconds: values.customSeconds,
      playbackTimeMs,
      episodeDurationMs,
    });
  }, [
    values.placement,
    values.customSeconds,
    playbackTimeMs,
    episodeDurationMs,
  ]);

  const filteredAds = useMemo(() => {
    const q = values.search.trim().toLowerCase();

    if (!q) {
      return adLibrary;
    }

    return adLibrary.filter((asset) => {
      const haystack = [asset.name, asset.campaign, asset.folder, asset.slug]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [adLibrary, values.search]);

  const selectedAsset = adLibrary.find((a) => a.id === values.selectedAssetId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <form
          id="ad-marker-form"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-4 p-6">
            <DialogHeader className="gap-1 space-y-0 text-left">
              <DialogTitle className="text-lg font-semibold">
                Create ad marker
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {values.step === 1
                  ? "Insert a new ad marker into this episode"
                  : values.markerType === "static"
                    ? "Choose placement and select the creative for this static marker."
                    : "This marker type is not available in this build yet."}
              </DialogDescription>
            </DialogHeader>

            {values.serverError ? (
              <Alert variant="destructive">
                <AlertTitle>Could not save</AlertTitle>
                <AlertDescription>{values.serverError}</AlertDescription>
              </Alert>
            ) : null}

            {values.step === 1 ? (
              <form.Field name="markerType">
                {(field) => (
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(value) => {
                      field.handleChange(value as MarkerType);
                    }}
                    className="flex flex-col gap-3"
                  >
                    {TYPE_ROWS.map(({ value, title, description, Icon }) => {
                      const inputId = `marker-type-${value}`;
                      const isSelected = field.state.value === value;

                      return (
                        <label
                          key={value}
                          htmlFor={inputId}
                          className={cn(
                            "block cursor-pointer rounded-xl border bg-card p-4 transition-colors",
                            isSelected
                              ? "border-foreground/25 bg-muted/40"
                              : "border-border hover:bg-muted/20",
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted/60"
                              aria-hidden
                            >
                              <Icon
                                className="size-6 text-foreground"
                                strokeWidth={1.5}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium leading-tight">
                                {title}
                              </div>
                              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                                {description}
                              </p>
                            </div>
                            <RadioGroupItem
                              value={value}
                              id={inputId}
                              className="size-4 shrink-0"
                            />
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                )}
              </form.Field>
            ) : null}

            {values.step === 2 && values.markerType === "static" ? (
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
                              id="placement-playhead"
                            />
                            <FieldLabel htmlFor="placement-playhead">
                              <span className="font-medium">
                                Current playhead
                              </span>
                              <span className="block text-xs font-normal text-muted-foreground">
                                {formatTimecode(playbackTimeMs)} → saves as{" "}
                                {formatTimecode(resolvedStartMs)}
                              </span>
                            </FieldLabel>
                          </Field>
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              value="custom"
                              id="placement-custom"
                            />
                            <FieldLabel htmlFor="placement-custom">
                              <span className="font-medium">Custom time</span>
                              <span className="block text-xs font-normal text-muted-foreground">
                                Enter position in seconds from the start of the
                                episode
                              </span>
                            </FieldLabel>
                          </Field>
                        </RadioGroup>
                      )}
                    </form.Field>
                    {values.placement === "custom" ? (
                      <form.Field name="customSeconds">
                        {(field) => {
                          const isInvalid = field.state.meta.errors.length > 0;

                          return (
                            <Field data-invalid={isInvalid} className="mt-2">
                              <FieldLabel htmlFor="custom-seconds">
                                Seconds
                              </FieldLabel>
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
                                Normalized position:{" "}
                                {formatTimecode(resolvedStartMs)} (
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
                                  const isSelected =
                                    field.state.value === asset.id;

                                  return (
                                    <button
                                      key={asset.id}
                                      type="button"
                                      data-slot="ad-picker-row"
                                      data-selected={
                                        isSelected ? "true" : "false"
                                      }
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
                                      <div className="font-medium">
                                        {asset.name}
                                      </div>
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
                          {formatDuration(selectedAsset.durationMs)} ·{" "}
                          {selectedAsset.cta}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Choose one ad. The timeline and list will update after
                        save.
                      </p>
                    )}
                  </FieldGroup>
                </FieldSet>
              </>
            ) : null}

            {values.step === 2 && values.markerType !== "static" ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Automatic and A/B test markers are not available in this build.
                Choose Static to continue, or go back to pick another type.
              </p>
            ) : null}
          </div>

          <DialogFooter className="border-t bg-muted/50">
            {values.step === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    onOpenChange(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-foreground text-background hover:bg-foreground/90 sm:flex-none"
                  onClick={() => {
                    form.setFieldValue("step", 2);
                  }}
                >
                  Select marker
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    form.setFieldValue("step", 1);
                    form.setFieldValue("serverError", "");
                  }}
                >
                  Back
                </Button>
                {values.markerType === "static" ? (
                  <Button
                    type="submit"
                    form="ad-marker-form"
                    className="flex-1 bg-foreground text-background hover:bg-foreground/90 sm:flex-none"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving…" : "Create marker"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="flex-1 bg-foreground text-background hover:bg-foreground/90 sm:flex-none"
                    onClick={() => {
                      onOpenChange(false);
                    }}
                  >
                    Close
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
