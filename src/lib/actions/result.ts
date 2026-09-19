/**
 * Discriminated result returned by every Server Action, so forms can branch
 * on `status` without try/catch and without inspecting error classes that do
 * not survive serialisation to the client.
 */
export type FieldErrors = Record<string, string[] | undefined>;

export type ActionSuccess<TData> = { status: "success"; data: TData };

export type ActionFailure = {
  status: "error";
  /** Stable code the UI can branch on. Mirrors the API's error codes. */
  code: string;
  /** Safe to show to the user. */
  message: string;
  /** Per-field messages keyed by input name, when the failure is validation. */
  fieldErrors?: FieldErrors;
};

export type ActionResult<TData> = ActionSuccess<TData> | ActionFailure;

/** `useActionState` needs a state before the first submit. */
export type ActionState<TData> = { status: "idle" } | ActionResult<TData>;

export const initialActionState: { status: "idle" } = { status: "idle" };

export function actionSuccess<TData>(data: TData): ActionSuccess<TData> {
  return { status: "success", data };
}

export function actionFailure(
  code: string,
  message: string,
  fieldErrors?: FieldErrors,
): ActionFailure {
  return fieldErrors
    ? { status: "error", code, message, fieldErrors }
    : { status: "error", code, message };
}
