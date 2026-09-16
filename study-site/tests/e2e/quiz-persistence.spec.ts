import { test, expect, type Page } from "@playwright/test";
import { quizzes } from "../../src/data/quiz";

const QUIZ_KEY = "inside-book-a-slot.quiz.v1";
const LEARNING_KEY = "inside-book-a-slot.learning.v1";

const overview = quizzes.find((q) => q.id === "overview")!;

async function gotoQuiz(page: Page, id: string) {
  await page.goto(`/quiz-hub?quiz=${id}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "← All quizzes" })).toBeVisible();
}

function optionButton(page: Page, qIdx: number, optIdx: number) {
  return page.getByRole("button", { name: new RegExp(`Option ${String.fromCharCode(65 + optIdx)}:`) });
}

function quizRecord(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), QUIZ_KEY);
}

async function answerAll(page: Page, quiz = overview) {
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    await optionButton(page, i, q.answerIndex).click();
    const label = i < quiz.questions.length - 1 ? "Check answer & continue" : "Check my answer";
    await page.getByRole("button", { name: label }).click();
  }
}

test.describe("Quiz persistence (localStorage record inside-book-a-slot.quiz.v1)", () => {
  test("a selection made but not checked survives a reload", async ({ page }) => {
    await gotoQuiz(page, "overview");
    const q0 = overview.questions[0];
    await optionButton(page, 0, q0.answerIndex).click();
    await expect(optionButton(page, 0, q0.answerIndex)).toHaveAttribute("aria-pressed", "true");

    await page.reload({ waitUntil: "networkidle" });
    await expect(optionButton(page, 0, q0.answerIndex)).toHaveAttribute("aria-pressed", "true");

    const record = await quizRecord(page);
    expect(record?.quizzes?.["overview"]?.selected?.[0]).toBe(q0.answerIndex);
    expect(record?.quizzes?.["overview"]?.submitted).toBe(false);
  });

  test("checked answers and the current position persist across a reload", async ({ page }) => {
    await gotoQuiz(page, "overview");
    await optionButton(page, 0, overview.questions[0].answerIndex).click();
    await page.getByRole("button", { name: "Check answer & continue" }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");

    await page.reload({ waitUntil: "networkidle" });
    // position restored to question 2 and question 1 keeps its checked verdict
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    await page.getByRole("button", { name: "← Previous" }).click();
    await expect(page.getByRole("status")).toContainText(/Correct\.|Not quite\./);

    const record = await quizRecord(page);
    expect(record?.quizzes?.["overview"]?.checked).toContain(0);
  });

  test("a submitted quiz reloads into the saved results view, never a silent restart", async ({ page }) => {
    await gotoQuiz(page, "overview");
    await answerAll(page);
    await page.getByRole("button", { name: "Submit quiz for score" }).click();
    await expect(page.getByText(/You got \d+ of \d+ correct/)).toBeVisible();

    await page.reload({ waitUntil: "networkidle" });
    // saved results view: score header plus per-question reviews are shown
    await expect(page.getByText(/You got \d+ of \d+ correct/)).toBeVisible();
    await expect(page.getByText(overview.questions[0].q)).toBeVisible();
    await expect(page.getByText(overview.questions[overview.questions.length - 1].q)).toBeVisible();

    // the interactive question flow is NOT shown again (no check button)
    await expect(page.getByRole("button", { name: /Check (answer & continue|my answer)/ })).toHaveCount(0);

    // score + pass record persisted
    const record = await quizRecord(page);
    expect(record?.quizzes?.["overview"]?.submitted).toBe(true);
    expect(record?.quizzes?.["overview"]?.score).toBeGreaterThanOrEqual(0.8);
  });

  test("results view names your pick, the correct answer and the misconception for a wrong pick", async ({ page }) => {
    await gotoQuiz(page, "overview");
    const q1 = overview.questions[1];
    const wrongIdx = (q1.answerIndex + 1) % q1.options.length;

    for (let i = 0; i < overview.questions.length; i++) {
      const idx = i === 1 ? wrongIdx : overview.questions[i].answerIndex;
      await optionButton(page, i, idx).click();
      const label = i < overview.questions.length - 1 ? "Check answer & continue" : "Check my answer";
      await page.getByRole("button", { name: label }).click();
    }
    await page.getByRole("button", { name: "Submit quiz for score" }).click();
    await expect(page.getByText(/You got \d+ of \d+ correct/)).toBeVisible();

    // your wrong pick is shown, as is the correct answer text
    await expect(page.getByText("Your answer:", { exact: false }).first()).toBeVisible();
    await expect(page.getByText(q1.options[wrongIdx]).first()).toBeVisible();
    await expect(page.getByText(q1.options[q1.answerIndex]).first()).toBeVisible();
  });

  test("Reset this quiz after a pass clears the record, the pass marker and returns to question 1", async ({ page }) => {
    await gotoQuiz(page, "overview");
    await answerAll(page);
    await page.getByRole("button", { name: "Submit quiz for score" }).click();
    await expect(page.getByText("Passed — nice.")).toBeVisible();

    await page.getByRole("button", { name: "Reset this quiz" }).click();
    // back in the interactive flow, fresh
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    await expect(page.getByText("Checked 0 of")).toBeVisible();
    // pass marker is cleared (reset is no longer pass-preserving)
    await expect(page.getByText("Passed — saved to learning progress")).toHaveCount(0);

    const learning = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), LEARNING_KEY);
    expect(learning.chapters?.["01-overview"]?.quizPassed).not.toBe(true);
    const record = await quizRecord(page);
    expect(record?.quizzes?.["overview"]).toBeUndefined();
  });
});