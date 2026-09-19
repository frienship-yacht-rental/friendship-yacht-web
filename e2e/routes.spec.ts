import { expect, test } from "@playwright/test";

test.describe("fleet page", () => {
  test("renders the heading and either the list or a graceful fallback", async ({
    page,
  }) => {
    await page.goto("/yachts");

    await expect(
      page.getByRole("heading", { level: 1, name: /the fleet/i }),
    ).toBeVisible();

    // Depending on whether the API was reachable at build time, one of these
    // is present. Neither outcome is a 500.
    const list = page.getByRole("link", { name: /enquire about/i }).first();
    const fallback = page.getByText(
      /temporarily unavailable|no yachts listed/i,
    );
    await expect(list.or(fallback)).toBeVisible();
  });
});

test.describe("contact page", () => {
  test("renders the enquiry form with labelled fields", async ({ page }) => {
    await page.goto("/contact");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send enquiry/i }),
    ).toBeEnabled();
  });

  test("keeps a valid yacht slug from the query string", async ({ page }) => {
    await page.goto("/contact?yacht=aurora-42");

    await expect(page.locator('input[name="yachtSlug"]')).toHaveValue(
      "aurora-42",
    );
  });

  test("drops a malformed yacht slug", async ({ page }) => {
    await page.goto("/contact?yacht=<script>");

    await expect(page.locator('input[name="yachtSlug"]')).toHaveCount(0);
  });
});

test.describe("route handlers", () => {
  test("health probe answers without touching the API", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
  });

  test("revalidation webhook refuses requests without the secret", async ({
    request,
  }) => {
    const response = await request.post("/api/revalidate", {
      data: { tags: ["yachts"] },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe("contact form against the live API", () => {
  test("submits an enquiry end to end", async ({ page, request }) => {
    // Integration path: only meaningful when friendship-yacht-api is running.
    const probe = await request
      .get("http://localhost:8000/health")
      .catch(() => null);
    test.skip(!probe?.ok(), "friendship-yacht-api is not running on :8000");

    await page.goto("/contact?yacht=aurora-42");
    await page.getByLabel(/name/i).fill("Ada Lovelace");
    await page.getByLabel(/email/i).fill("ada@example.com");
    await page
      .getByLabel(/message/i)
      .fill("I would like to arrange a sea trial.");
    await page.getByRole("button", { name: /send enquiry/i }).click();

    await expect(page.getByText(/we have your enquiry/i)).toBeVisible();
    await expect(page.getByText(/your reference is/i)).toBeVisible();
  });

  test("shows validation errors inline before calling the API", async ({
    page,
    request,
  }) => {
    const probe = await request
      .get("http://localhost:8000/health")
      .catch(() => null);
    test.skip(!probe?.ok(), "friendship-yacht-api is not running on :8000");

    await page.goto("/contact");
    await page.getByLabel(/name/i).fill("Ada Lovelace");
    await page.getByLabel(/email/i).fill("not-an-email");
    await page
      .getByLabel(/message/i)
      .fill("I would like to arrange a sea trial.");
    await page.getByRole("button", { name: /send enquiry/i }).click();

    await expect(page.getByLabel(/email/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("surfaces an API-side rejection the form cannot know about", async ({
    page,
    request,
  }) => {
    const probe = await request
      .get("http://localhost:8000/health")
      .catch(() => null);
    test.skip(!probe?.ok(), "friendship-yacht-api is not running on :8000");

    // A well-formed slug the web schema accepts, for a yacht the API has never
    // heard of. Only the API can reject this, and it does so with a 400, not
    // field errors — so the form reports it as a toast.
    await page.goto("/contact?yacht=ghost-99");
    await page.getByLabel(/name/i).fill("Ada Lovelace");
    await page.getByLabel(/email/i).fill("ada@example.com");
    await page
      .getByLabel(/message/i)
      .fill("I would like to arrange a sea trial.");
    await page.getByRole("button", { name: /send enquiry/i }).click();

    await expect(page.getByText(/unknown yacht "ghost-99"/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send enquiry/i }),
    ).toBeEnabled();
  });
});
