import { test, expect } from "@playwright/test";
import { ROUTES, expectedNavFor, expectedCrumbFor, startErrorCollector } from "./helpers";

test.describe("navigation + breadcrumbs for all 13 routes", () => {
  for (const route of ROUTES) {
    test(`route ${route}: page renders, nav + breadcrumb correct`, async ({ page }) => {
      const collector = await startErrorCollector(page);

      const res = await page.goto(route, { waitUntil: "networkidle" });
      expect(res?.status(), `${route} should be 200`).toBe(200);

      // a real h1 exists (not a blank shell)
      const h1 = page.locator("main h1").first();
      await expect(h1).toBeVisible();

      // desktop primary nav present and correct aria-current for this route
      const primary = page.locator('nav[aria-label="Primary"]');
      await expect(primary).toBeVisible();

      const expectedNav = expectedNavFor(route);
      // The Reference entry is a dropdown trigger (<button>), not an <a>, so
      // scan any element carrying the active marker.
      const activeLinks = primary.locator('[aria-current="page"]');
      const activeTexts = await activeLinks.allTextContents();

      if (expectedNav) {
        expect(activeTexts.map((t) => t.trim()).filter(Boolean), `${route} should mark ${expectedNav} active`).toContain(expectedNav);
      }

      // no OTHER nav link on this route should be marked active besides the expected one
      // (guards the "wrong Home highlight" regression)
      if (expectedNav !== "Home") {
        const homeActive = activeTexts.some((t) => t.trim() === "Home");
        expect(homeActive, `${route} must not highlight Home`).toBe(false);
      }

      // breadcrumb: current crumb matches the route, and Reference appears for reference routes
      const nav = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(nav).toBeVisible();
      await expect(nav.locator('[aria-current="page"]')).toHaveText(expectedCrumbFor(route));
      if (route.startsWith("/reference/")) {
        await expect(nav).toContainText("Reference");
      }

      await collector.assertClean();
    });
  }
});