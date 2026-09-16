import { test, expect, type Page } from "@playwright/test";
import { quizzes } from "../../src/data/quiz";
import { startErrorCollector } from "./helpers";

const LEARNING_KEY = "inside-book-a-slot.learning.v1";

const overview = quizzes.find((q) => q.id === "overview")!;
const concurrency = quizzes.find((q) => q.id === "concurrency")!;

async function gotoQuiz(page: Page, id: string) {
  await page.goto(`/quiz-hub?quiz=${id}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "← All quizzes" })).toBeVisible();
}

/** Locate the option button for a given question index and option index. */
function optionButton(page: Page, qIdx: number, optIdx: number) {
  return page.getByRole("button", { name: new RegExp(`Option ${String.fromCharCode(65 + optIdx)}:`) });
}

test.describe("Quiz card — full interaction lifecycle", () => {
  test("select, check, feedback, and next flow for a correct answer", async ({ page }) => {
    const collector = await startErrorCollector(page);
    await gotoQuiz(page, "overview");

    // first question, pick the correct option (per quiz data)
    const q0 = overview.questions[0];
    await optionButton(page, 0, q0.answerIndex).click();
    await expect(optionButton(page, 0, q0.answerIndex)).toHaveAttribute("aria-pressed", "true");

    const checkBtn = page.getByRole("button", { name: "Check answer & continue" });
    await expect(checkBtn).toBeEnabled();
    await checkBtn.click();

    // feedback status shown with the correct verdict
    await expect(page.getByRole("status")).toContainText("Correct.");
    await expect(page.getByRole("status")).toContainText(q0.explanation);

    // only advances after checking; progress moves to question 2
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    await collector.assertClean();
  });

  test("wrong answer shows the correct answer, explanation, misconception and source", async ({ page }) => {
    await gotoQuiz(page, "overview");
    const q0 = overview.questions[0];
    const wrongIdx = (q0.answerIndex + 1) % q0.options.length;

    await optionButton(page, 0, wrongIdx).click();
    await page.getByRole("button", { name: "Check answer & continue" }).click();

    const status = page.getByRole("status");
    await expect(status).toContainText("Not quite.");
    await expect(status).toContainText(`Correct answer: ${q0.options[q0.answerIndex]}.`);
    await expect(status).toContainText(q0.explanation);
    if (q0.misconception) {
      await expect(status).toContainText("A common misconception:");
      await expect(status).toContainText(q0.misconception);
    }
    await expect(status).toContainText(q0.sourceReference);
  });

  test("previous/next navigation preserves answers and updates progress", async ({ page }) => {
    await gotoQuiz(page, "overview");

    await optionButton(page, 0, overview.questions[0].answerIndex).click();
    await page.getByRole("button", { name: "Check answer & continue" }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");

    await page.getByRole("button", { name: "← Previous" }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    // kept answer
    await expect(optionButton(page, 0, overview.questions[0].answerIndex)).toHaveAttribute("aria-pressed", "true");
    // status for question 1 still shown
    await expect(page.getByRole("status")).toContainText(/Correct\.|Not quite\./);

    await page.getByRole("button", { name: "Next →" }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });

  test("submit is gated until every question is checked", async ({ page }) => {
    await gotoQuiz(page, "concurrency");

    const submit = page.getByRole("button", { name: "Submit quiz for score" });
    // nothing selected yet → submit disabled
    await expect(submit).toBeDisabled();

    // answer all questions correctly but do not check one
    for (let i = 0; i < concurrency.questions.length - 1; i++) {
      await optionButton(page, i, concurrency.questions[i].answerIndex).click();
      const label = i < concurrency.questions.length - 2 ? "Check answer & continue" : "Check answer & continue";
      await page.getByRole("button", { name: label }).click();
    }
    // last question still unanswered
    await expect(submit).toBeDisabled();
  });

  test("full pass journey writes progress and persists across reload", async ({ page }) => {
    const collector = await startErrorCollector(page);
    await gotoQuiz(page, "overview");

    for (let i = 0; i < overview.questions.length; i++) {
      const q = overview.questions[i];
      await optionButton(page, i, q.answerIndex).click();
      const label = i < overview.questions.length - 1 ? "Check answer & continue" : "Check my answer";
      await page.getByRole("button", { name: label }).click();
    }

    const submit = page.getByRole("button", { name: "Submit quiz for score" });
    await expect(submit).toBeEnabled();
    await submit.click();

    // passed summary
    await expect(page.getByText("Passed — nice.")).toBeVisible();
    await expect(page.getByText(/100%/)).toBeVisible();

    // persisted marker + learning localStorage
    const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), LEARNING_KEY);
    expect(state.chapters?.["01-overview"]?.quizPassed).toBe(true);

    // reload keeps the pass badge
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("Passed — saved to learning progress")).toBeVisible();
    await collector.assertClean();
  });

  test("reset clears answers, the persisted record and the pass marker", async ({ page }) => {
    await gotoQuiz(page, "overview");

    for (let i = 0; i < overview.questions.length; i++) {
      const q = overview.questions[i];
      await optionButton(page, i, q.answerIndex).click();
      const label = i < overview.questions.length - 1 ? "Check answer & continue" : "Check my answer";
      await page.getByRole("button", { name: label }).click();
    }
    await page.getByRole("button", { name: "Submit quiz for score" }).click();
    await expect(page.getByText("Passed — nice.")).toBeVisible();

    await page.getByRole("button", { name: "Reset this quiz" }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    await expect(page.getByText("Checked 0 of")).toBeVisible();
    // the pass marker is no longer "saved to learning progress" after a reset
    await expect(page.getByText("Passed — saved to learning progress")).toHaveCount(0);

    // the persisted quiz record was cleared
    const record = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), "inside-book-a-slot.quiz.v1");
    expect(record?.quizzes?.["overview"]).toBeUndefined();
    // the learning pass marker was cleared
    const learning = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), LEARNING_KEY);
    expect(learning.chapters?.["01-overview"]?.quizPassed).not.toBe(true);
  });

  test("keyboard interaction selects and checks without a mouse", async ({ page }) => {
    await gotoQuiz(page, "overview");
    const q0 = overview.questions[0];

    const target = optionButton(page, 0, q0.answerIndex);
    await target.focus();
    await page.keyboard.press("Enter");
    await expect(target).toHaveAttribute("aria-pressed", "true");

    const check = page.getByRole("button", { name: "Check answer & continue" });
    await check.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText("Correct.");
  });
});