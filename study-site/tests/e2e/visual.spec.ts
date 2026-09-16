import { test, expect, type Page } from "@playwright/test";
import { ROUTES, colorLuminance } from "./helpers";

async function assertNoHorizontalOverflow(page: Page) {
  const width = page.viewportSize()?.width ?? 1440;
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth, `no horizontal overflow; document=${scrollWidth} viewport=${width}`).toBeLessThanOrEqual(width + 1);
}

test.describe("visual & responsive sanity (all viewports)", () => {
  for (const route of ROUTES) {
    test(`${route}: no horizontal overflow`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      await assertNoHorizontalOverflow(page);
    });
  }

  test("topbar sticks to the top while scrolling", async ({ page }) => {
    await page.goto("/chapters/08-booking-lifecycle", { waitUntil: "networkidle" });
    const header = page.getByRole("banner");
    const y0 = (await header.boundingBox())!.y;
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(150);
    const y1 = (await header.boundingBox())!.y;
    expect(Math.abs(y1 - y0)).toBeLessThan(2);
  });

  test("dark request panel and response panel are legible (playground)", async ({ page }) => {
    await page.goto("/playground", { waitUntil: "networkidle" });
    // request panel is dark slate with light text
    const requestPanel = page.locator(".bg-slate-900").first();
    await expect(requestPanel).toBeVisible();
    const bg = await colorLuminance(page, requestPanel, null, "backgroundColor");
    // the visible request line sits in the indigo path span (the <p> itself is
    // styled by prose typography, not by the panel)
    const text = await colorLuminance(page, requestPanel, ".text-indigo-300", "color");
    expect(bg).toBeLessThan(45); // very dark background
    expect(text).toBeGreaterThan(140); // light text
  });

  test("which-is-real figure caption is legible on dark strip", async ({ page }) => {
    await page.goto("/chapters/19-interactive-learning", { waitUntil: "networkidle" });
    const caption = page.locator("figure figcaption").first();
    await expect(caption).toBeVisible();
    const bg = await colorLuminance(page, caption, null, "backgroundColor");
    const text = await colorLuminance(page, caption, null, "color");
    expect(bg).toBeLessThan(45);
    expect(text).toBeGreaterThan(140);
  });

  test("interactive control focus is visible on tab", async ({ page }) => {
    await page.goto("/quiz-hub", { waitUntil: "networkidle" });
    // focus the first module toggle and confirm a focus-visible outline appears
    const toggle = page.locator("section").first().locator("button[aria-expanded]").first();
    await toggle.focus();
    const focusVisible = await toggle.evaluate((el) => el.matches(":focus-visible"));
    expect(focusVisible).toBe(true);
  });
});