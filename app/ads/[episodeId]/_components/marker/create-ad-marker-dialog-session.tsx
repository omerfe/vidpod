"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { filterAdLibraryBySearch } from "@/lib/ads/ad-library-filter";
import type { EditorAdAsset } from "@/lib/ads/contracts";
import {
  adMarkerFormSchema,
  createAdMarkerFormDefaultValues,
  resolveMarkerStartMs,
} from "@/lib/ads/create-ad-marker-form";
import type { MarkerSnapshot } from "@/lib/ads/editor-history";
import {
  type CreatedAbTestResult,
  useCreateAdMarkerSubmit,
} from "./create-ad-marker-dialog-submit";
import { CreateAdMarkerStepAbTest } from "./create-ad-marker-step-ab-test";
import { CreateAdMarkerStepAbTestResults } from "./create-ad-marker-step-ab-test-results";
import { CreateAdMarkerStepAuto } from "./create-ad-marker-step-auto";
import { CreateAdMarkerStepMarkerType } from "./create-ad-marker-step-marker-type";
import { CreateAdMarkerStepStatic } from "./create-ad-marker-step-static";

const STEP_2_DESCRIPTIONS: Record<string, string> = {
  static: "Choose placement and select the creative for this static marker.",
  auto: "Choose placement and select candidate ads for auto resolution.",
  ab_test: "Select which ads you'd like to A/B test.",
};

function getStep3Description(result: CreatedAbTestResult | null) {
  if (!result) {
    return "Review the seeded results for this A/B test.";
  }

  const testedCount = result.experimentSummary.variants.length;
  return `${testedCount} ${testedCount === 1 ? "ad" : "ads"} tested`;
}

export function CreateAdMarkerDialogSession(props: {
  episodeSlug: string;
  episodeDurationMs: number;
  adLibrary: EditorAdAsset[];
  playbackTimeMs: number;
  onStepChange?: (step: 1 | 2 | 3) => void;
  onRequestClose: () => void;
  onMarkerCreated?: (markerId: string, snapshot: MarkerSnapshot) => void;
}) {
  const [createdAbTestResult, setCreatedAbTestResult] =
    useState<CreatedAbTestResult | null>(null);
  const [isResettingTest, setIsResettingTest] = useState(false);
  const deleteMarkerMutation = useMutation(api.ads.deleteMarker);
  const { onSubmit } = useCreateAdMarkerSubmit({
    episodeSlug: props.episodeSlug,
    playbackTimeMs: props.playbackTimeMs,
    episodeDurationMs: props.episodeDurationMs,
    adLibrary: props.adLibrary,
    onAbTestCreated: (result) => {
      setCreatedAbTestResult(result);
      form.setFieldValue("step", 3);
    },
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

  const isSubmittableType =
    values.markerType === "static" ||
    values.markerType === "auto" ||
    values.markerType === "ab_test";

  const title =
    values.step === 3
      ? "A/B test results"
      : values.step === 2 && values.markerType === "ab_test"
        ? "A/B test"
        : "Create ad marker";

  const submitLabel =
    values.markerType === "ab_test" ? "Create A/B test" : "Create marker";

  const submitDisabled =
    isSubmitting ||
    (values.markerType === "ab_test" && values.selectedAssetIds.length < 2);

  useEffect(() => {
    props.onStepChange?.(values.step);
  }, [props.onStepChange, values.step]);

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
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {values.step === 1
              ? "Insert a new ad marker into this episode"
              : values.step === 3
                ? getStep3Description(createdAbTestResult)
                : (STEP_2_DESCRIPTIONS[values.markerType] ?? "")}
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

        {values.step === 2 && values.markerType === "auto" ? (
          <CreateAdMarkerStepAuto
            form={form}
            playbackTimeMs={props.playbackTimeMs}
            resolvedStartMs={resolvedStartMs}
            filteredAds={filteredAds}
            selectedAssetIds={values.selectedAssetIds}
            placementIsCustom={values.placement === "custom"}
          />
        ) : null}

        {values.step === 2 && values.markerType === "ab_test" ? (
          <CreateAdMarkerStepAbTest
            form={form}
            adLibrary={props.adLibrary}
            filteredAds={filteredAds}
            selectedAssetIds={values.selectedAssetIds}
          />
        ) : null}

        {values.step === 3 &&
        values.markerType === "ab_test" &&
        createdAbTestResult ? (
          <CreateAdMarkerStepAbTestResults
            adLibrary={props.adLibrary}
            experimentSummary={createdAbTestResult.experimentSummary}
          />
        ) : null}
      </div>

      <DialogFooter className="border-t-0 bg-popover">
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
            {values.markerType === "auto" ? (
              <Button
                type="submit"
                form="ad-marker-form"
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 sm:flex-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating…" : "Create marker"}
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 sm:flex-none"
                onClick={() => {
                  form.setFieldValue("step", 2);
                }}
              >
                Select marker
              </Button>
            )}
          </>
        ) : values.step === 3 ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={isResettingTest}
              onClick={async () => {
                if (!createdAbTestResult) {
                  return;
                }

                form.setFieldValue("serverError", "");
                setIsResettingTest(true);

                try {
                  await deleteMarkerMutation({
                    markerId: createdAbTestResult.markerId as Id<"adMarkers">,
                  });
                  setCreatedAbTestResult(null);
                  form.setFieldValue("selectedAssetIds", []);
                  form.setFieldValue("search", "");
                  form.setFieldValue("serverError", "");
                  form.setFieldValue("step", 2);
                } catch (caught) {
                  const message =
                    caught instanceof Error
                      ? caught.message
                      : "Could not start a new A/B test";
                  form.setFieldValue("serverError", message);
                } finally {
                  setIsResettingTest(false);
                }
              }}
            >
              {isResettingTest ? "Starting new test…" : "New test"}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-foreground text-background hover:bg-foreground/90 sm:flex-none"
              disabled={isResettingTest}
              onClick={() => {
                if (createdAbTestResult) {
                  props.onMarkerCreated?.(
                    createdAbTestResult.markerId,
                    createdAbTestResult.snapshot,
                  );
                }
                props.onRequestClose();
              }}
            >
              Done
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
            {isSubmittableType ? (
              <div className="flex w-full items-center justify-end gap-3 sm:ml-auto sm:w-auto">
                {values.markerType === "ab_test" ? (
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {values.selectedAssetIds.length}{" "}
                    {values.selectedAssetIds.length === 1 ? "ad" : "ads"}{" "}
                    selected
                  </p>
                ) : null}
                <Button
                  type="submit"
                  form="ad-marker-form"
                  className="flex-1 bg-foreground text-background hover:bg-foreground/90 sm:flex-none"
                  disabled={submitDisabled}
                >
                  {isSubmitting ? "Saving…" : submitLabel}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </DialogFooter>
    </form>
  );
}
