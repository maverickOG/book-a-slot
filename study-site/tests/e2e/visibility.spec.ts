import { test, expect, type Page } from "@playwright/test";
import { colorLuminance } from "./helpers";

/**
 * Dark-surface text visibility regression tests.
 *
 * Root cause of the "ghost text" bug: `.chapter-content p` (and strong / links)
 * in src/styles/global.css are UNLAYERED rules that always beat Tailwind's
 * layered `text-*` utilities and inherited light colors, so paragraphs inside
 * `bg-slate-900` panels rendered slate-700-on-slate-900 (nearly invisible).
 * The fix moved prose colors behind custom-property tokens
 * (`--surface-text/--surface-strong/--surface-link`) and added a shared
 * `.dark-surface` token scope for every dark panel.
 *
 * These tests assert the text is genuinely light on the dark panel (the
 * "present but invisible" case) and that normal light prose stayed dark.
 */

async function darkPanelContrast(
  page: Page,
  panel: ReturnType<Page["locator"]>,
  textSelector: string,
) {
  await expect(panel.first()).toBeVisible();
  const bg = await colorLuminance(page, panel.first(), null, "backgroundColor");
  const text = await colorLuminance(page, panel.first(), textSelector, "color");
  expect(bg, "panel background must be dark").toBeLessThan(45);
  expect(text, "panel text must be clearly light").toBeGreaterThan(140);
}

test.describe("dark-surface text visibility", () => {
  test("RequestFlow detail on /chapters/08-booking-lifecycle is light on the navy panel", async ({ page }) => {
    await page.goto("/chapters/08-booking-lifecycle", { waitUntil: "networkidle" });
    await darkPanelContrast(
      page,
      page.locator("div.bg-slate-900").filter({ hasText: "Provider sends" }),
      "p.leading-relaxed",
    );
  });

  test("all three RequestFlow panels on /chapters/16-request-lifecycles are legible", async ({ page }) => {
    await page.goto("/chapters/16-request-lifecycles", { waitUntil: "networkidle" });
    const panels = page.locator("div.bg-slate-900");
    expect(await panels.count()).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < (await panels.count()); i++) {
      await darkPanelContrast(page, panels.nth(i), "p.leading-relaxed");
    }
  });

  test("DockerStack env block on /chapters/11-docker-basics renders env lines light-on-dark", async ({ page }) => {
    await page.goto("/chapters/11-docker-basics", { waitUntil: "networkidle" });
    await darkPanelContrast(
      page,
      page.locator("div.bg-slate-900").filter({ hasText: "DATABASE_URL" }),
      "p",
    );
  });

  test("in-chapter RequestSimulator auth line on /chapters/19-interactive-learning stays light", async ({ page }) => {
    await page.goto("/chapters/19-interactive-learning", { waitUntil: "networkidle" });
    const line = page.locator("p.sim-auth-line").first();
    await expect(line).toBeVisible();
    const text = await colorLuminance(page, line, null, "color");
    expect(text).toBeGreaterThan(140);
  });

  test("light prose stays dark on light surfaces (no inverse problem)", async ({ page }) => {
    await page.goto("/chapters/08-booking-lifecycle", { waitUntil: "networkidle" });
    const p = page.locator(".chapter-content > p").first();
    await expect(p).toBeVisible();
    const text = await colorLuminance(page, p, null, "color");
    expect(text).toBeLessThan(140);
    expect(text).toBeGreaterThan(20);
  });

  test("migration timeline card text stays dark on white (/reference/migrations)", async ({ page }) => {
    await page.goto("/reference/migrations", { waitUntil: "networkidle" });
    const card = page.locator(".rounded-xl.border.border-slate-200.bg-white").first();
    await expect(card).toBeVisible();
    const text = await colorLuminance(page, card, ".font-semibold", "color");
    expect(text).toBeLessThan(140);
  });
});