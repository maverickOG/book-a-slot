import { test, expect } from "@playwright/test";
import { colorLuminance } from "./helpers";

test.describe("UI correction regression suite (video evidence on failure)", () => {
  test("VIS-SPACING-START-001 | /start — headings have bottom-relaxed spacing", async ({ page }) => {
    await page.goto("/start", { waitUntil: "networkidle" });

    await expect(page.locator(".page-header").first()).toBeVisible();

    // First article h2 must have a generous top margin (>2rem = 32px).
    const h2 = page.locator("article.chapter-content h2").first();
    await expect(h2).toBeVisible();
    const marginTop = await h2.evaluate((el) => parseFloat(getComputedStyle(el).marginTop));
    expect(marginTop, "h2 top margin should be >= 32px (2rem)").toBeGreaterThanOrEqual(32);

    const marginBottom = await h2.evaluate((el) => parseFloat(getComputedStyle(el).marginBottom));
    expect(marginBottom, "h2 bottom margin should be >= 8px").toBeGreaterThanOrEqual(8);
  });

  test("VIS-SPACING-PLAYGROUND-001 | /playground — island sections sit in a consistent rhythm", async ({ page }) => {
    await page.goto("/playground", { waitUntil: "networkidle" });

    // Island sections (Simulator, Code Puzzle, OrderSteps) should each carry >=2rem top margin.
    const sections = page.locator("article.chapter-content section.rounded-2xl");
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < count; i++) {
      const section = sections.nth(i);
      await expect(section).toBeVisible();
      const marginTop = await section.evaluate((el) => parseFloat(getComputedStyle(el).marginTop));
      expect(marginTop, `island section ${i} top margin should be >= 32px`).toBeGreaterThanOrEqual(32);
    }
  });

  test("VIS-CONTRAST-SIMULATOR-001 | /playground — auth line is light on the dark request panel", async ({ page }) => {
    await page.goto("/playground", { waitUntil: "networkidle" });

    const requestPanel = page.locator(".bg-slate-900").first();
    await expect(requestPanel).toBeVisible();
    const bg = await colorLuminance(page, requestPanel, null, "backgroundColor");
    expect(bg, "request panel background should be dark").toBeLessThan(45);

    const authLine = page.locator(".sim-auth-line").first();
    await expect(authLine).toBeVisible();
    const authText = await colorLuminance(page, authLine, null, "color");
    expect(authText, "auth line text should be light (>140)").toBeGreaterThan(140);

    const path = page.locator(".text-indigo-300").first();
    const pathText = await colorLuminance(page, path, null, "color");
    expect(pathText, "path text should be light indigo (>140)").toBeGreaterThan(140);
  });

  test("VIS-CODE-PUZZLE-DESKTOP-001 | /playground @1440 — figure choices stack in one column", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/playground", { waitUntil: "networkidle" });

    const figures = page.locator("figure");
    const count = await figures.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const first = await figures.first().boundingBox();
    const second = await figures.nth(1).boundingBox();
    expect(first && second).toBeTruthy();

    // stacked: the second option's top sits below the first option's bottom
    expect(second!.y, "second figure should be below the first").toBeGreaterThanOrEqual(first!.y + first!.height! - 2);
    // single column: shared x position
    expect(Math.abs(first!.x - second!.x), "figures should share the same x").toBeLessThan(5);
  });

  test("VIS-CODE-PUZZLE-MOBILE-001 | /playground @375 — puzzle card causes no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/playground", { waitUntil: "networkidle" });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "no horizontal overflow at 375px").toBeLessThanOrEqual(376);

    // code blocks still render and scroll inside their cards
    await expect(page.locator("figure pre").first()).toBeVisible();
  });

  test("VIS-GLOSSARY-COPY-001 | /glossary — requested copy, styled def-term, no 375px overflow", async ({ page }) => {
    await page.goto("/glossary", { waitUntil: "networkidle" });

    // exact requested copy
    await expect(page.getByText("Browse 49 terms here.")).toBeVisible();
    await expect(page.getByText("highlighted terms can be opened for quick definitions")).toBeVisible();
    // the old "hoverable" wording is gone
    await expect(page.getByText("hoverable")).toBeHidden();

    // def-term is visibly underlined (dotted) on a chapter that renders inline terms
    await page.goto("/chapters/01-overview", { waitUntil: "networkidle" });
    const defTerm = page.locator("button.def-term").first();
    await expect(defTerm).toBeVisible();
    const borderBottom = await defTerm.evaluate((el) => getComputedStyle(el).borderBottomStyle);
    expect(borderBottom).toBe("dotted");

    // glossary page has no overflow at mobile width
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/glossary", { waitUntil: "networkidle" });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "glossary has no horizontal overflow at 375px").toBeLessThanOrEqual(376);
  });

  test("E2E-GLOSSARY-TERM-001 | /chapters/01-overview — terms open/close via click and hover", async ({ page }) => {
    await page.goto("/chapters/01-overview", { waitUntil: "networkidle" });
    const defTerm = page.locator("button.def-term").first();
    await expect(defTerm).toBeVisible();

    const tooltip = page.locator('[role="tooltip"]').first();

    // click toggles open, click again closes
    await defTerm.click();
    await expect(tooltip).toBeVisible();
    await defTerm.click();
    await expect(tooltip).toBeHidden();

    // move the pointer away, then hover reopens and mouseleave closes
    await page.mouse.move(0, 0);
    await defTerm.hover();
    await expect(tooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
  });
});