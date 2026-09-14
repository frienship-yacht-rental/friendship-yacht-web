import { describe, expect, it } from "vitest";

import { yachtListSchema, yachtSchema } from "./schema";

const validYacht = {
  id: "3f1c2b7e-9a4d-4f8b-88c1-2a6d5e0f7b31",
  slug: "aurora-42",
  name: "Aurora",
  model: "FS 42",
  lengthOverallMeters: 12.8,
  beamMeters: 4.1,
  draftMeters: 2.2,
  yearBuilt: 2024,
  heroImageUrl: "https://cdn.example.com/aurora.jpg",
  summary: "A fast cruiser.",
};

describe("yachtSchema", () => {
  it("accepts a well-formed yacht", () => {
    expect(yachtSchema.parse(validYacht)).toMatchObject({ slug: "aurora-42" });
  });

  it("allows a missing hero image", () => {
    const result = yachtSchema.safeParse({ ...validYacht, heroImageUrl: null });
    expect(result.success).toBe(true);
  });

  it("strips fields the app does not model", () => {
    const parsed = yachtSchema.parse({ ...validYacht, internalCostCents: 1 });
    expect(parsed).not.toHaveProperty("internalCostCents");
  });

  it("rejects a non-UUID id", () => {
    const result = yachtSchema.safeParse({ ...validYacht, id: "42" });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive dimensions", () => {
    const result = yachtSchema.safeParse({
      ...validYacht,
      lengthOverallMeters: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range build year", () => {
    expect(
      yachtSchema.safeParse({ ...validYacht, yearBuilt: 1800 }).success,
    ).toBe(false);
  });
});

describe("yachtListSchema", () => {
  it("parses a page of results", () => {
    const parsed = yachtListSchema.parse({ items: [validYacht], total: 1 });
    expect(parsed.items).toHaveLength(1);
    expect(parsed.total).toBe(1);
  });

  it("rejects a negative total", () => {
    expect(yachtListSchema.safeParse({ items: [], total: -1 }).success).toBe(
      false,
    );
  });
});
