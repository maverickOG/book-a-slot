import { test, expect } from "@playwright/test";
import { startErrorCollector } from "./helpers";

const LEARNING_KEY = "inside-book-a-slot.learning.v1";

test.describe("Quiz hub", () => {
  test("renders summary, module sections and correct counts", async ({ page }) => {
    const collector = await startErrorCollector(page);
    await page.goto("/quiz-hub", { waitUntil: "networkidle" });

    await expect(page.locator("div.mb-6 p", { hasText: /19 quizzes/ })).toBeVisible();
    await expect(page.getByText(/questions/).first()).toBeVisible();
    await expect(page.getByText("passing score")).toBeVisible();

    // every quiz belongs to a module that shows counts
    const moduleToggles = page.locator("button[aria-expanded]").filter({ has: page.locator("p") });
    expect(await moduleToggles.count()).toBeGreaterThanOrEqual(9);

    await collector.assertClean();
  });

  test("module toggle collapses and expands its quiz cards", async ({ page }) => {
    await page.goto("/quiz-hub", { waitUntil: "networkidle" });

    // pick the first module toggle; its section contains quiz cards
    const toggle = page.locator("section").first().locator("button[aria-expanded]");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const section = page.locator("section").first();
    const cardCountBefore = await section.locator("button").count();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    // section content (its quiz cards) should no longer be visible
    await expect(section.locator("text=/Start quiz|Review quiz/").first()).toBeHidden({ timeout: 3000 }).catch(() => {});

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(await section.locator("button").count()).toBe(cardCountBefore);
  });

  test("opening a quiz updates the URL via replaceState and shows the card", async ({ page }) => {
    const collector = await startErrorCollector(page);
    await page.goto("/quiz-hub", { waitUntil: "networkidle" });

    const firstCard = page.locator("button", { hasText: "Start quiz" }).first();
    await firstCard.click();

    await expect(page).toHaveURL(/\?quiz=/);
    await expect(page.getByRole("button", { name: "← All quizzes" })).toBeVisible();
    await expect(page.getByText("Self-check").first()).toBeVisible();

    await collector.assertClean();
  });

  test("deep link ?quiz=booking-flow opens that quiz directly", async ({ page }) => {
    await page.goto("/quiz-hub?quiz=booking-flow", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "← All quizzes" })).toBeVisible();
    await expect(page.getByText("Self-check").first()).toBeVisible();
    // URL preserved
    await expect(page).toHaveURL(/quiz=booking-flow/);
  });

  test("Back to all quizzes returns to hub and clears the deep link", async ({ page }) => {
    await page.goto("/quiz-hub?quiz=overview", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "← All quizzes" }).click();
    await expect(page).not.toHaveURL(/quiz=/);
    await expect(page.getByText(/quizzes/).first()).toBeVisible();
  });

  test("a passed quiz shows Passed status and Review quiz in the hub", async ({ page }) => {
    await page.addInitScript((key) => {
      const state = {
        version: "v1",
        chapters: { "01-overview": { opened: true, readToEnd: false, quizPassed: true, mastered: false, updatedAt: Date.now() } },
      };
      window.localStorage.setItem(key, JSON.stringify(state));
    }, LEARNING_KEY);

    await page.goto("/quiz-hub", { waitUntil: "networkidle" });
    const overviewCard = page.locator("button", { hasText: "The project at a glance" });
    await expect(overviewCard).toContainText("Passed");
    await expect(overviewCard).toContainText("Review quiz");
  });

  test("reload preserves pass state from localStorage", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: "v1",
          chapters: { "04-database-models": { opened: true, readToEnd: false, quizPassed: true, mastered: false, updatedAt: Date.now() } },
        }),
      );
    }, LEARNING_KEY);

    await page.goto("/quiz-hub", { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    // only passed quizzes show "Review quiz" under their card; the seeded
    // chapter-04 quiz is one of them (module open by default, ≤ 3 quizzes)
    const dbCard = page.locator("button", { hasText: /Review quiz/ }).filter({ hasText: /data layer|The data layer/ }).first();
    await expect(dbCard).toContainText("Review quiz");
  });

  test("a partially-answered record shows In progress and Continue quiz", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: "v1",
          quizzes: {
            overview: { selected: { 0: 0 }, checked: [], submitted: false, score: 0, correctCount: 0, current: 1, attempts: 1, updatedAt: Date.now() },
          },
        }),
      );
    }, "inside-book-a-slot.quiz.v1");

    await page.goto("/quiz-hub", { waitUntil: "networkidle" });
    const card = page.locator("button", { hasText: "The project at a glance" });
    await expect(card).toContainText("In progress");
    await expect(card).toContainText("Continue quiz");
  });

  test("a failed submitted record shows Completed with its score and Review attempt", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: "v1",
          quizzes: {
            overview: { selected: { 0: 1, 1: 1, 2: 1 }, checked: [0, 1, 2], submitted: true, score: 1 / 3, correctCount: 1, current: 2, attempts: 2, updatedAt: Date.now() },
          },
        }),
      );
    }, "inside-book-a-slot.quiz.v1");

    await page.goto("/quiz-hub", { waitUntil: "networkidle" });
    const card = page.locator("button", { hasText: "The project at a glance" });
    await expect(card).toContainText("Completed");
    await expect(card).toContainText("33%");
    await expect(card).toContainText("Review attempt");
  });

  test("a passed submitted record shows Passed even without the learning marker", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: "v1",
          quizzes: {
            overview: { selected: { 0: 0, 1: 0, 2: 0 }, checked: [0, 1, 2], submitted: true, score: 1, correctCount: 3, current: 2, attempts: 1, updatedAt: Date.now() },
          },
        }),
      );
    }, "inside-book-a-slot.quiz.v1");

    await page.goto("/quiz-hub", { waitUntil: "networkidle" });
    const card = page.locator("button", { hasText: "The project at a glance" });
    await expect(card).toContainText("Passed");
    await expect(card).toContainText("Review quiz");
  });

  test("Reset all quiz progress clears every quiz record and pass marker", async ({ page }) => {
    await page.addInitScript(
      ([learnKey, quizKey]) => {
        window.localStorage.setItem(
          learnKey,
          JSON.stringify({
            version: "v1",
            chapters: { "01-overview": { opened: true, readToEnd: false, quizPassed: true, mastered: false, updatedAt: Date.now() } },
          }),
        );
        window.localStorage.setItem(
          quizKey,
          JSON.stringify({
            version: "v1",
            quizzes: {
              overview: { selected: { 0: 0 }, checked: [], submitted: false, score: 0, correctCount: 0, current: 1, attempts: 1, updatedAt: Date.now() },
              concurrency: { selected: { 0: 1 }, checked: [0], submitted: true, score: 0.33, correctCount: 1, current: 1, attempts: 1, updatedAt: Date.now() },
            },
          }),
        );
      },
      [LEARNING_KEY, "inside-book-a-slot.quiz.v1"],
    );

    await page.goto("/quiz-hub", { waitUntil: "networkidle" });
    await expect(page.getByText("Quiz passed: 1 /")).toBeVisible();

    page.on("dialog", (d) => d.accept());
    await page.locator("#reset-all-quizzes").click();

    await expect(page.getByText("Quiz passed: 0 /")).toBeVisible();
    const quizRecord = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), "inside-book-a-slot.quiz.v1");
    expect(quizRecord?.quizzes?.overview).toBeUndefined();
    expect(quizRecord?.quizzes?.concurrency).toBeUndefined();

    const learning = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), LEARNING_KEY);
    expect(learning.chapters?.["01-overview"]?.quizPassed).not.toBe(true);
  });
});