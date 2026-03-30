import type { FormApi, ReactFormExtendedApi } from "@tanstack/react-form";
import type {
  AdMarkerFormValues,
  adMarkerFormSchema,
} from "@/lib/ads/create-ad-marker-form";

export type AdMarkerCoreFormApi = FormApi<
  AdMarkerFormValues,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  typeof adMarkerFormSchema,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined
>;

export type AdMarkerFormApi = ReactFormExtendedApi<
  AdMarkerFormValues,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  typeof adMarkerFormSchema,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined
>;
