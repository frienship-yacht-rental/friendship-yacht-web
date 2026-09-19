import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import type { Yacht } from "../schema";
import { YachtCard } from "./yacht-card";

const yacht: Yacht = {
  id: "5d7c1a3e-8f2b-4c6d-9e1a-2b3c4d5e6f70",
  slug: "aurora-42",
  name: "Aurora",
  model: "FY 42",
  lengthOverallMeters: 12.8,
  beamMeters: 4.1,
  draftMeters: 2.2,
  yearBuilt: 2024,
  heroImageUrl: null,
  summary: "A fast cruiser.",
};

describe("YachtCard", () => {
  it("shows the model, year and dimensions", () => {
    renderWithProviders(<YachtCard yacht={yacht} />);

    expect(screen.getByText("FY 42")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("12.8 m")).toBeInTheDocument();
  });

  it("links the enquiry to this yacht", () => {
    renderWithProviders(<YachtCard yacht={yacht} />);

    expect(
      screen.getByRole("link", { name: /enquire about aurora/i }),
    ).toHaveAttribute("href", "/contact?yacht=aurora-42");
  });
});
