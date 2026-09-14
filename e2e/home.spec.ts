import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders the hero and its calls to action", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /performance sailing/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /explore the fleet/i }),
    ).toBeVisible();
  });

  test("sets the security headers the app depends on", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("frame-ancestors");
    // The framework should not be advertised.
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("serves a 404 page for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /page not found/i }),
    ).toBeVisible();
  });

  test("exposes robots and sitemap", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("<urlset");
  });
});
