import { test, expect, type Page } from "@playwright/test";

async function openFirstTerm(page: Page) {
  const defTerm = page.locator("button.def-term").first();
  await expect(defTerm).toBeVisible();
  await defTerm.click();
  return defTerm;
}

test.describe("Glossary terms (inline popovers)", () => {
  test("glossary page renders all categories with terms", async ({ page }) => {
    await page.goto("/glossary", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Glossary" })).toBeVisible();
    // several category sections exist (Python, FastAPI, Database, ...)
    const sections = page.locator("main section");
    expect(await sections.count()).toBeGreaterThanOrEqual(5);

    // dl definition pairs render
    const terms = page.locator("main dt");
    expect(await terms.count()).toBeGreaterThan(10);
  });

  test("clicking an inline term opens the popover; clicking again closes it", async ({ page }) => {
    await page.goto("/chapters/01-overview", { waitUntil: "networkidle" });
    const defTerm = await openFirstTerm(page);

    const tooltip = page.locator('[role="tooltip"]').first();
    await expect(tooltip).toBeVisible();
    const termText = await defTerm.textContent();
    await expect(tooltip).toContainText(termText ?? "");

    await defTerm.click();
    await expect(tooltip).toBeHidden();
  });

  test("Escape closes the popover", async ({ page }) => {
    await page.goto("/chapters/01-overview", { waitUntil: "networkidle" });
    const defTerm = page.locator("button.def-term").first();
    await defTerm.click();
    await expect(page.locator('[role="tooltip"]').first()).toBeVisible();

    await defTerm.press("Escape");
    await expect(page.locator('[role="tooltip"]').first()).toBeHidden();
  });

  test("hover also opens the popover (onMouseEnter)", async ({ page }) => {
    await page.goto("/chapters/01-overview", { waitUntil: "networkidle" });
    const defTerm = page.locator("button.def-term").first();
    await defTerm.hover();
    await expect(page.locator('[role="tooltip"]').first()).toBeVisible();
    // moving away closes it (onMouseLeave)
    await page.mouse.move(0, 0);
    await expect(page.locator('[role="tooltip"]').first()).toBeHidden();
  });

  test("tooltip does not overflow the viewport at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/chapters/01-overview", { waitUntil: "networkidle" });
    await page.locator("button.def-term").first().click();

    const tooltip = page.locator('[role="tooltip"]').first();
    await expect(tooltip).toBeVisible();
    const box = await tooltip.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390 + 1);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });
});