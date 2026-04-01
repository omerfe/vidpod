/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ads from "../ads.js";
import type * as ads_adsDomain from "../ads/adsDomain.js";
import type * as ads_adsMarkerLifecycle from "../ads/adsMarkerLifecycle.js";
import type * as ads_adsPersistence from "../ads/adsPersistence.js";
import type * as ads_adsReadModel from "../ads/adsReadModel.js";
import type * as ads_seed from "../ads/seed.js";
import type * as lib_contracts from "../lib/contracts.js";
import type * as lib_media from "../lib/media.js";
import type * as lib_validators from "../lib/validators.js";
import type * as uploads from "../uploads.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ads: typeof ads;
  "ads/adsDomain": typeof ads_adsDomain;
  "ads/adsMarkerLifecycle": typeof ads_adsMarkerLifecycle;
  "ads/adsPersistence": typeof ads_adsPersistence;
  "ads/adsReadModel": typeof ads_adsReadModel;
  "ads/seed": typeof ads_seed;
  "lib/contracts": typeof lib_contracts;
  "lib/media": typeof lib_media;
  "lib/validators": typeof lib_validators;
  uploads: typeof uploads;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
