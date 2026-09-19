import "server-only";

import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { reportError } from "@/lib/observability/report-error";

import {
  actionFailure,
  type ActionResult,
  actionSuccess,
  type FieldErrors,
} from "./result";

/**
 * Turns a FormData into a plain object. Empty strings become `undefined` so
 * optional fields left blank validate as absent rather than as "".
 */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const object: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    object[key] = value === "" ? undefined : value;
  }
  return object;
}

/**
 * Shared body for Server Actions: validate input, run the handler, and turn
 * every outcome into an `ActionResult`. Actions themselves stay one-liners in
 * a `"use server"` file, which keeps that file's "only export async
 * functions" rule trivially satisfied.
 *
 * - Zod failure → `VALIDATION_ERROR` with per-field messages.
 * - `ApiError` 422 → the API's field errors, so the form shows them inline.
 * - Other `ApiError` → its code and message (already client-safe).
 * - Anything else → reported, and a generic `UNEXPECTED` failure.
 */
export async function runAction<TSchema extends z.ZodType, TData>(
  schema: TSchema,
  input: FormData | unknown,
  handler: (input: z.infer<TSchema>) => Promise<TData>,
  context: { name: string },
): Promise<ActionResult<TData>> {
  const raw = input instanceof FormData ? formDataToObject(input) : input;
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return actionFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      z.flattenError(parsed.error).fieldErrors as FieldErrors,
    );
  }

  try {
    return actionSuccess(await handler(parsed.data as z.infer<TSchema>));
  } catch (error) {
    if (error instanceof ApiError) {
      return actionFailure(
        error.code ?? "API_ERROR",
        error.isRetryable
          ? "The service is temporarily unavailable."
          : error.message,
        apiFieldErrors(error),
      );
    }

    reportError(error, { source: "server-action", action: context.name });
    return actionFailure(
      "UNEXPECTED",
      "Something went wrong. Please try again.",
    );
  }
}

/** Extracts `details.body.fieldErrors` from the API's 422 envelope, if present. */
function apiFieldErrors(error: ApiError): FieldErrors | undefined {
  if (error.status !== 422) return undefined;
  const details = error.details as
    { body?: { fieldErrors?: FieldErrors } } | undefined;
  return details?.body?.fieldErrors;
}
