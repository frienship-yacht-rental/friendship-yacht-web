import { beforeEach, describe, expect, it, vi } from "vitest";

import { actionFailure, actionSuccess } from "@/lib/actions/result";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { submitInquiry } from "../actions";
import { InquiryForm } from "./inquiry-form";

// The real action is a "use server" module that calls the API. Vitest is not
// an RSC runtime, so the form is tested against a mocked action instead.
vi.mock("../actions", () => ({ submitInquiry: vi.fn() }));

const mockedSubmit = vi.mocked(submitInquiry);

async function fillAndSubmit(
  user: ReturnType<typeof renderWithProviders>["user"],
) {
  await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
  await user.type(screen.getByLabelText(/email/i), "ada@example.com");
  await user.type(
    screen.getByLabelText(/message/i),
    "Arrange a sea trial please.",
  );
  await user.click(screen.getByRole("button", { name: /send enquiry/i }));
}

describe("InquiryForm", () => {
  beforeEach(() => {
    mockedSubmit.mockReset();
  });

  it("renders every field with an accessible label", () => {
    renderWithProviders(<InquiryForm />);

    for (const label of [/name/i, /email/i, /phone/i, /message/i]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("carries the yacht slug as a hidden field", () => {
    const { container } = renderWithProviders(
      <InquiryForm yachtSlug="aurora-42" />,
    );

    expect(container.querySelector('input[name="yachtSlug"]')).toHaveValue(
      "aurora-42",
    );
  });

  it("marks fields invalid and shows the message from a failed action", async () => {
    mockedSubmit.mockResolvedValue(
      actionFailure("VALIDATION_ERROR", "Please fix the highlighted fields.", {
        email: ["Please enter a valid email address"],
      }),
    );
    const { user } = renderWithProviders(<InquiryForm />);

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });
    expect(
      screen.getByText("Please enter a valid email address"),
    ).toBeInTheDocument();
  });

  it("replaces the form with a confirmation on success", async () => {
    mockedSubmit.mockResolvedValue(
      actionSuccess({
        id: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
        receivedAt: "2026-09-18T10:00:00.000Z",
      }),
    );
    const { user } = renderWithProviders(<InquiryForm />);

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByText(/we have your enquiry/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /send enquiry/i }),
    ).not.toBeInTheDocument();
  });
});
