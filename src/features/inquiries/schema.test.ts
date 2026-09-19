import { describe, expect, it } from "vitest";

import { createInquirySchema } from "./schema";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I would like to arrange a sea trial next month.",
};

describe("createInquirySchema", () => {
  it("accepts a complete enquiry", () => {
    expect(createInquirySchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an optional yacht slug", () => {
    expect(
      createInquirySchema.safeParse({ ...valid, yachtSlug: "aurora-42" })
        .success,
    ).toBe(true);
  });

  it("rejects a malformed yacht slug", () => {
    expect(
      createInquirySchema.safeParse({ ...valid, yachtSlug: "Not A Slug" })
        .success,
    ).toBe(false);
  });

  it("gives user-facing messages for the common mistakes", () => {
    const result = createInquirySchema.safeParse({
      name: "A",
      email: "nope",
      message: "short",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("Please enter your name");
    expect(messages).toContain("Please enter a valid email address");
  });
});
