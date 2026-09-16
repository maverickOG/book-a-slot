import { test, expect } from "@playwright/test";
import { ROUTES, expectedNavMobileFor, expectedCrumbFor } from "./helpers";

test.describe("mobile nav (iPhone) for all 13 routes", () => {
  for (const route of ROUTES) {
    test(`mobile route ${route}: mobile nav active + breadcrumb`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      // desktop primary nav is hidden at mobile, mobile nav is used
      await expect(page.locator('nav[aria-label="Primary"]')).toBeHidden();
      const mobile = page.locator('nav[aria-label="Primary mobile"]');
      await expect(mobile).toBeVisible();

      const expectedNav = expectedNavMobileFor(route);
      const activeTexts = await mobile.locator('a[aria-current="page"]').allTextContents();
      if (expectedNav) {
        expect(activeTexts.map((t) => t.trim()).filter(Boolean), `${route} should mark ${expectedNav} active (mobile)`).toContain(expectedNav);
      }
      if (expectedNav !== "Home" && expectedNav !== null) {
        expect(activeTexts.some((t) => t.trim() === "Home")).toBe(false);
      }

      // breadcrumb present on mobile too
      const nav = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(nav).toBeVisible();
      await expect(nav.locator('[aria-current="page"]')).toHaveText(expectedCrumbFor(route));

      // mobile nav must not overflow horizontally
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `route ${route} should not overflow at mobile width`).toBeLessThanOrEqual(page.viewportSize()?.width ?? 390);
    });
  }
});