import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import Home from "./page";

describe("Home", () => {
  it("renders a single top-level heading", () => {
    renderWithProviders(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: /performance sailing/i }),
    ).toBeInTheDocument();
  });

  it("exposes the primary calls to action as links", () => {
    renderWithProviders(<Home />);

    expect(
      screen.getByRole("link", { name: /explore the fleet/i }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: /request a consultation/i }),
    ).toBeInTheDocument();
  });
});
