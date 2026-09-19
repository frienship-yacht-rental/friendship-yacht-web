import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";

import { formDataToObject, runAction } from "./run-action";

const schema = z.object({
  name: z.string().min(2, "Too short"),
  note: z.string().optional(),
});

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

describe("formDataToObject", () => {
  it("turns blank fields into undefined so optional fields validate as absent", () => {
    expect(formDataToObject(form({ name: "Ada", note: "" }))).toEqual({
      name: "Ada",
      note: undefined,
    });
  });
});

describe("runAction", () => {
  const ctx = { name: "test" };

  it("returns success with the handler's data", async () => {
    const result = await runAction(
      schema,
      form({ name: "Ada" }),
      async (input) => ({ greeting: `hi ${input.name}` }),
      ctx,
    );

    expect(result).toEqual({ status: "success", data: { greeting: "hi Ada" } });
  });

  it("maps a Zod failure to per-field messages without calling the handler", async () => {
    const handler = vi.fn();

    const result = await runAction(schema, form({ name: "A" }), handler, ctx);

    expect(handler).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: "error",
      code: "VALIDATION_ERROR",
      fieldErrors: { name: ["Too short"] },
    });
  });

  it("surfaces the API's 422 field errors so the form can show them inline", async () => {
    const error = new ApiError("Validation failed", {
      status: 422,
      url: "https://api.test.local/x",
      code: "VALIDATION_ERROR",
      details: { body: { fieldErrors: { name: ["Already taken"] } } },
    });

    const result = await runAction(
      schema,
      form({ name: "Ada" }),
      async () => {
        throw error;
      },
      ctx,
    );

    expect(result).toMatchObject({
      status: "error",
      code: "VALIDATION_ERROR",
      fieldErrors: { name: ["Already taken"] },
    });
  });

  it("replaces a 5xx message with a generic one", async () => {
    const error = new ApiError("db password is hunter2", {
      status: 503,
      url: "https://api.test.local/x",
    });

    const result = await runAction(
      schema,
      form({ name: "Ada" }),
      async () => {
        throw error;
      },
      ctx,
    );

    expect(result).toMatchObject({ status: "error" });
    expect(JSON.stringify(result)).not.toContain("hunter2");
  });

  it("reports unknown errors and returns a generic failure", async () => {
    const report = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await runAction(
      schema,
      form({ name: "Ada" }),
      async () => {
        throw new TypeError("boom");
      },
      ctx,
    );

    expect(result).toMatchObject({ status: "error", code: "UNEXPECTED" });
    expect(report).toHaveBeenCalledWith(
      "[server-action]",
      expect.any(TypeError),
      expect.objectContaining({ action: "test" }),
    );
  });
});
