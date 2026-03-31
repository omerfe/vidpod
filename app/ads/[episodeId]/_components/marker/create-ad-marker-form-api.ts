import type { FormApi, ReactFormExtendedApi } from "@tanstack/react-form";
import type { AdMarkerFormValues } from "@/lib/ads/create-ad-marker-form";

export type AdMarkerCoreFormApi = FormApi<
  AdMarkerFormValues,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

export type AdMarkerFormApi = ReactFormExtendedApi<
  AdMarkerFormValues,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;
