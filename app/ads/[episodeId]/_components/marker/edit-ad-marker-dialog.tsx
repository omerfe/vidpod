"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useMemo, useState } from "react";
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
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { filterAdLibraryBySearch } from "@/lib/ads/ad-library-filter";
import type { EditorAdAsset, EditorMarker } from "@/lib/ads/contracts";
import {
  type AdMarkerFormValues,
  adMarkerFormSchema,
  resolveMarkerStartMs,
} from "@/lib/ads/create-ad-marker-form";
import { CreateAdMarkerStepAbTest } from "./create-ad-marker-step-ab-test";
import { CreateAdMarkerStepAuto } from "./create-ad-marker-step-auto";
import { CreateAdMarkerStepStatic } from "./create-ad-marker-step-static";

const EDIT_DESCRIPTIONS: Record<string, string> = {
  static: "Change the placement or creative for this static marker.",
  auto: "Change the placement or candidate pool for this auto marker.",
  ab_test: "Change the ad variants for this A/B test.",
};

function buildEditDefaults(marker: EditorMarker): AdMarkerFormValues {
  const startSeconds = marker.startMs / 1000;

  const staticAssignment = marker.assignments.find(
    (a) => a.role === "static",
  );

  return {
    step: 2,
    markerType: marker.type,
    placement: "custom",
    customSeconds: String(startSeconds),
    selectedAssetId: staticAssignment?.adAssetId ?? null,
    selectedAssetIds: marker.assignments.map((a) => a.adAssetId),
    search: "",
    serverError: "",
  };
}

export function EditAdMarkerDialog({
  open,
  onOpenChange,
  marker,
  episodeDurationMs,
  adLibrary,
  playbackTimeMs,
  onMarkerUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marker: EditorMarker;
  episodeDurationMs: number;
  adLibrary: EditorAdAsset[];
  playbackTimeMs: number;
  onMarkerUpdated?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          marker.type === "ab_test" ? "sm:max-w-4xl" : "sm:max-w-4xl"
        }
      >
        {open ? (
          <EditAdMarkerDialogSession
            marker={marker}
            episodeDurationMs={episodeDurationMs}
            adLibrary={adLibrary}
            playbackTimeMs={playbackTimeMs}
            onRequestClose={() => onOpenChange(false)}
            onMarkerUpdated={onMarkerUpdated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditAdMarkerDialogSession({
  marker,
  episodeDurationMs,
  adLibrary,
  playbackTimeMs,
  onRequestClose,
  onMarkerUpdated,
}: {
  marker: EditorMarker;
  episodeDurationMs: number;
  adLibrary: EditorAdAsset[];
  playbackTimeMs: number;
  onRequestClose: () => void;
  onMarkerUpdated?: () => void;
}) {
  const updateMarkerMutation = useMutation(api.ads.updateMarker);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: buildEditDefaults(marker),
    validators: {
      onSubmit: adMarkerFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      form.setFieldValue("serverError", "");

      const startMs = resolveMarkerStartMs({
        placement: value.placement,
        customSeconds: value.customSeconds,
        playbackTimeMs,
        episodeDurationMs,
      });

      let adAssetIds: Id<"adAssets">[];
      if (value.markerType === "static") {
        if (!value.selectedAssetId) return;
        adAssetIds = [value.selectedAssetId] as unknown as Id<"adAssets">[];
      } else {
        adAssetIds =
          value.selectedAssetIds as unknown as Id<"adAssets">[];
      }

      try {
        await updateMarkerMutation({
          markerId: marker.id as Id<"adMarkers">,
          startMs,
          adAssetIds,
        });
        onMarkerUpdated?.();
        onRequestClose();
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Could not update marker";
        form.setFieldValue("serverError", message);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const values = useStore(form.store, (state) => state.values);

  const resolvedStartMs = useMemo(() => {
    return resolveMarkerStartMs({
      placement: values.placement,
      customSeconds: values.customSeconds,
      playbackTimeMs,
      episodeDurationMs,
    });
  }, [values.placement, values.customSeconds, playbackTimeMs, episodeDurationMs]);

  const filteredAds = useMemo(() => {
    return filterAdLibraryBySearch(adLibrary, values.search);
  }, [adLibrary, values.search]);

  const selectedAsset = adLibrary.find(
    (a) => a.id === values.selectedAssetId,
  );

  const submitDisabled =
    isSubmitting ||
    (values.markerType === "static" && !values.selectedAssetId) ||
    (values.markerType === "ab_test" && values.selectedAssetIds.length < 2) ||
    (values.markerType === "auto" && values.selectedAssetIds.length < 1);

  const submitLabel = isSubmitting ? "Saving…" : "Save changes";

  return (
    <form
      id="edit-marker-form"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-4">
        <DialogHeader className="gap-1 space-y-0 text-left">
          <DialogTitle className="text-lg font-semibold">
            Edit marker
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {EDIT_DESCRIPTIONS[marker.type] ?? ""}
          </DialogDescription>
        </DialogHeader>

        {values.serverError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save</AlertTitle>
            <AlertDescription>{values.serverError}</AlertDescription>
          </Alert>
        ) : null}

        {marker.type === "static" ? (
          <CreateAdMarkerStepStatic
            form={form}
            playbackTimeMs={playbackTimeMs}
            resolvedStartMs={resolvedStartMs}
            filteredAds={filteredAds}
            selectedAsset={selectedAsset}
            placementIsCustom={values.placement === "custom"}
          />
        ) : null}

        {marker.type === "auto" ? (
          <CreateAdMarkerStepAuto
            form={form}
            playbackTimeMs={playbackTimeMs}
            resolvedStartMs={resolvedStartMs}
            filteredAds={filteredAds}
            selectedAssetIds={values.selectedAssetIds}
            placementIsCustom={values.placement === "custom"}
          />
        ) : null}

        {marker.type === "ab_test" ? (
          <CreateAdMarkerStepAbTest
            form={form}
            adLibrary={adLibrary}
            filteredAds={filteredAds}
            selectedAssetIds={values.selectedAssetIds}
          />
        ) : null}
      </div>

      <DialogFooter className="border-t-0 bg-popover">
        <Button
          type="button"
          variant="outline"
          className="flex-1 sm:flex-none"
          onClick={onRequestClose}
        >
          Cancel
        </Button>
        <div className="flex w-full items-center justify-end gap-3 sm:ml-auto sm:w-auto">
          {marker.type === "ab_test" ? (
            <p className="text-xs text-muted-foreground sm:text-sm">
              {values.selectedAssetIds.length}{" "}
              {values.selectedAssetIds.length === 1 ? "ad" : "ads"} selected
            </p>
          ) : null}
          <Button
            type="submit"
            form="edit-marker-form"
            className="flex-1 bg-foreground text-background hover:bg-foreground/90 sm:flex-none"
            disabled={submitDisabled}
          >
            {submitLabel}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
