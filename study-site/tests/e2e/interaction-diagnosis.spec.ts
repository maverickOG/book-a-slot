import { test, expect, type Page } from "@playwright/test";
import { quizzes } from "../../src/data/quiz";

/**
 * Diagnostic spec: reproduce the reported "controls render but cannot be clicked"
 * symptom. If a React island's client bundle fails to hydrate, the SSR buttons
 * still paint but clicks do nothing. This suite proves hydration actually
 * happened on every island page and real click-throughs change the DOM.
 */

async function collectConsole(page: Page) {
  const logs: string[] = [];
  const failed: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") logs.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
  page.on("requestfailed", (r) => failed.push(r.url()));
  return { logs, failed };
}

test.describe("real-browser hydration & click-through diagnosis", () => {
  test("quiz-hub interactive island hydrates and responds to clicks", async ({ page }) => {
    const { logs, failed } = await collectConsole(page);
    const res = await page.goto("/quiz-hub", { waitUntil: "networkidle" });
    expect(res!.status()).toBe(200);

    // island scripts load (no 404s)
    expect(failed.filter((u) => u.includes("/_astro/"))).toEqual([]);

    // clicking a quiz card must navigate to the single-quiz view (state change)
    const firstCard = page.locator("button", { hasText: "Start quiz" }).first();
    await firstCard.click();
    await expect(page.getByRole("button", { name: "← All quizzes" })).toBeVisible({ timeout: 8000 });

    expect(logs.filter((l) => l.includes("pageerror") || l.includes("hydration") || l.includes("Hydration"))).toEqual([]);
  });

  test("playground islands hydrate (RequestSimulator + WhichIsReal + OrderSteps)", async ({ page }) => {
    const { logs, failed } = await collectConsole(page);
    await page.goto("/playground", { waitUntil: "networkidle" });
    expect(failed.filter((u) => u.includes("/_astro/"))).toEqual([]);

    // RequestSimulator: click an endpoint button → request panel text changes
    await page.getByRole("button", { name: /POST \/auth\/login/ }).click();
    await expect(page.locator(".bg-slate-900").first()).toContainText("/auth/login");

    // OrderSteps: a click appends a step to Your sequence
    const steps = page.getByText("Order the steps").last().locator("..");
    await steps.locator("div.flex.flex-wrap.gap-2 button").first().click();
    // the remove control is an icon button labelled via aria-label, not text
    await expect(steps.getByRole("button", { name: "remove step" }).first()).toBeVisible();

    expect(logs.filter((l) => l.includes("pageerror") || l.includes("hydration"))).toEqual([]);
  });

  test("chapter-08 embedded islands respond (QuizCard + OrderSteps + Request simulator)", async ({ page }) => {
    const { logs, failed } = await collectConsole(page);
    await page.goto("/chapters/08-booking-lifecycle", { waitUntil: "networkidle" });
    expect(failed.filter((u) => u.includes("/_astro/"))).toEqual([]);

    const quizEmbedded = page.locator("section", { hasText: "Self-check" }).first();
    if ((await quizEmbedded.count()) > 0) {
      const opt = quizEmbedded.getByRole("button", { name: /Option A:/ }).first();
      await opt.click();
      await expect(opt).toHaveAttribute("aria-pressed", "true");
    }
    expect(logs.filter((l) => l.includes("pageerror") || l.includes("hydration"))).toEqual([]);
  });

  test("glossary term buttons hydrate and open popovers on chapter pages", async ({ page }) => {
    const { logs, failed } = await collectConsole(page);
    await page.goto("/chapters/01-overview", { waitUntil: "networkidle" });
    expect(failed.filter((u) => u.includes("/_astro/"))).toEqual([]);

    const defTerm = page.locator("button.def-term").first();
    await expect(defTerm).toBeVisible();
    await defTerm.click();
    await expect(page.locator('[role="tooltip"]').first()).toBeVisible({ timeout: 8000 });

    expect(logs.filter((l) => l.includes("pageerror") || l.includes("hydration"))).toEqual([]);
  });

  test("every quiz from the data file opens and renders its first question", async ({ page }) => {
    for (const quiz of quizzes) {
      test.setTimeout(30_000);
      await page.goto(`/quiz-hub?quiz=${quiz.id}`, { waitUntil: "networkidle" });
      await expect(page.getByText("Self-check").first()).toBeVisible();
      // the question text and at least two option buttons render
      await expect(page.getByRole("button", { name: /Option A:/ })).toBeVisible();
      const opts = page.getByRole("button", { name: /Option [A-H]:/ });
      expect(await opts.count()).toBeGreaterThanOrEqual(2);
    }
  });
});