import type { FormApi, ReactFormExtendedApi } from "@tanstack/react-form";
import type {
  AdMarkerFormValues,
  adMarkerFormSchema,
} from "@/lib/ads/create-ad-marker-form";

type OnSubmitValidator = typeof adMarkerFormSchema;

export type AdMarkerCoreFormApi = FormApi<
  AdMarkerFormValues,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  OnSubmitValidator,
  undefined,
  undefined,
  undefined,
  undefined,
  never
>;

export type AdMarkerFormApi = ReactFormExtendedApi<
  AdMarkerFormValues,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  OnSubmitValidator,
  undefined,
  undefined,
  undefined,
  undefined,
  never
>;
