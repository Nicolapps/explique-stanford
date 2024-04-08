/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * Generated by convex@1.8.0.
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin_exercises from "../admin/exercises.js";
import type * as admin_groupAssignment from "../admin/groupAssignment.js";
import type * as admin_identitiesJwt from "../admin/identitiesJwt.js";
import type * as admin_image from "../admin/image.js";
import type * as admin_researchConsent from "../admin/researchConsent.js";
import type * as admin_scores from "../admin/scores.js";
import type * as admin_weeks from "../admin/weeks.js";
import type * as attempts from "../attempts.js";
import type * as auth from "../auth.js";
import type * as authDbWriter from "../authDbWriter.js";
import type * as chat from "../chat.js";
import type * as correctness_exercises from "../correctness/exercises.js";
import type * as exercises from "../exercises.js";
import type * as lucia from "../lucia.js";
import type * as lucia_epfl from "../lucia_epfl.js";
import type * as lucia_tequila from "../lucia_tequila.js";
import type * as quiz from "../quiz.js";
import type * as researchConsent from "../researchConsent.js";
import type * as weeks from "../weeks.js";
import type * as withAuth from "../withAuth.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "admin/exercises": typeof admin_exercises;
  "admin/groupAssignment": typeof admin_groupAssignment;
  "admin/identitiesJwt": typeof admin_identitiesJwt;
  "admin/image": typeof admin_image;
  "admin/researchConsent": typeof admin_researchConsent;
  "admin/scores": typeof admin_scores;
  "admin/weeks": typeof admin_weeks;
  attempts: typeof attempts;
  auth: typeof auth;
  authDbWriter: typeof authDbWriter;
  chat: typeof chat;
  "correctness/exercises": typeof correctness_exercises;
  exercises: typeof exercises;
  lucia: typeof lucia;
  lucia_epfl: typeof lucia_epfl;
  lucia_tequila: typeof lucia_tequila;
  quiz: typeof quiz;
  researchConsent: typeof researchConsent;
  weeks: typeof weeks;
  withAuth: typeof withAuth;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
