"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { filterAdLibraryBySearch } from "@/lib/ads/ad-library-filter";
import type { EditorAdAsset } from "@/lib/ads/contracts";
import {
  adMarkerFormSchema,
  createAdMarkerFormDefaultValues,
  resolveMarkerStartMs,
} from "@/lib/ads/create-ad-marker-form";
import type { MarkerSnapshot } from "@/lib/ads/editor-history";
import { useCreateAdMarkerSubmit } from "./create-ad-marker-dialog-submit";
import { CreateAdMarkerStepMarkerType } from "./create-ad-marker-step-marker-type";
import { CreateAdMarkerStepStatic } from "./create-ad-marker-step-static";
import { CreateAdMarkerStepUnavailable } from "./create-ad-marker-step-unavailable";

export function CreateAdMarkerDialogSession(props: {
  episodeSlug: string;
  episodeDurationMs: number;
  adLibrary: EditorAdAsset[];
  playbackTimeMs: number;
  onRequestClose: () => void;
  onMarkerCreated?: (markerId: string, snapshot: MarkerSnapshot) => void;
}) {
  const { onSubmit } = useCreateAdMarkerSubmit({
    episodeSlug: props.episodeSlug,
    playbackTimeMs: props.playbackTimeMs,
    episodeDurationMs: props.episodeDurationMs,
    onRequestClose: props.onRequestClose,
    onMarkerCreated: props.onMarkerCreated,
  });

  const form = useForm({
    defaultValues: createAdMarkerFormDefaultValues(),
    validators: {
      onSubmit: adMarkerFormSchema,
    },
    onSubmit,
  });

  const values = useStore(form.store, (state) => state.values);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const resolvedStartMs = useMemo(() => {
    return resolveMarkerStartMs({
      placement: values.placement,
      customSeconds: values.customSeconds,
      playbackTimeMs: props.playbackTimeMs,
      episodeDurationMs: props.episodeDurationMs,
    });
  }, [
    values.placement,
    values.customSeconds,
    props.playbackTimeMs,
    props.episodeDurationMs,
  ]);

  const filteredAds = useMemo(() => {
    return filterAdLibraryBySearch(props.adLibrary, values.search);
  }, [props.adLibrary, values.search]);

  const selectedAsset = props.adLibrary.find(
    (a) => a.id === values.selectedAssetId,
  );

  return (
    <form
      id="ad-marker-form"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-4">
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
          <CreateAdMarkerStepMarkerType form={form} />
        ) : null}

        {values.step === 2 && values.markerType === "static" ? (
          <CreateAdMarkerStepStatic
            form={form}
            playbackTimeMs={props.playbackTimeMs}
            resolvedStartMs={resolvedStartMs}
            filteredAds={filteredAds}
            selectedAsset={selectedAsset}
            placementIsCustom={values.placement === "custom"}
          />
        ) : null}

        {values.step === 2 && values.markerType !== "static" ? (
          <CreateAdMarkerStepUnavailable />
        ) : null}
      </div>

      <DialogFooter className="bg-popover border-t-0">
        {values.step === 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => {
                props.onRequestClose();
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
                  props.onRequestClose();
                }}
              >
                Close
              </Button>
            )}
          </>
        )}
      </DialogFooter>
    </form>
  );
}
