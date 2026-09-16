import { test, expect, type Page } from "@playwright/test";
import { startErrorCollector } from "./helpers";

const LEARNING_KEY = "inside-book-a-slot.learning.v1";

function chapterState(page: Page, id: string) {
  return page.evaluate(
    ({ key, chapterId }) => JSON.parse(localStorage.getItem(key) ?? "{}")?.chapters?.[chapterId],
    { key: LEARNING_KEY, chapterId: id },
  );
}

test.describe("Chapter completion tracking (P2)", () => {
  test("opening a chapter records opened but never completes it", async ({ page }) => {
    await page.goto("/chapters/15-api-reference", { waitUntil: "networkidle" });
    // wait for the open-mark script to run
    await expect.poll(async () => (await chapterState(page, "15-api-reference"))?.opened).toBe(true);
    await page.waitForTimeout(500);
    expect((await chapterState(page, "15-api-reference"))?.readToEnd).not.toBe(true);
  });

  test("reading to partway does NOT complete the lesson even when the end marker is on screen", async ({ page }) => {
    await page.goto("/chapters/15-api-reference", { waitUntil: "networkidle" });

    // Put the end marker ~800px from the viewport top (inside the old observer's
    // 90% band) while the absolute bottom of the page is still far below.
    await page.evaluate(() => {
      const marker = document.getElementById("chapter-end");
      if (!marker) return;
      window.scrollTo(0, marker.getBoundingClientRect().top + window.scrollY - 800);
    });
    await page.waitForTimeout(600);

    // The marker is visible, but the reader has NOT reached the lesson's end yet.
    const meta = await page.evaluate(() => ({
      atBottom: Math.abs(window.scrollY + window.innerHeight - document.documentElement.scrollHeight) < 8,
    }));
    expect(meta.atBottom).toBe(false);
    expect((await chapterState(page, "15-api-reference"))?.readToEnd).not.toBe(true);
  });

  test("scrolling to the absolute end completes the chapter and persists after reload", async ({ page }) => {
    await page.goto("/chapters/15-api-reference", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(async () => (await chapterState(page, "15-api-reference"))?.readToEnd).toBe(true);

    await page.reload({ waitUntil: "networkidle" });
    expect((await chapterState(page, "15-api-reference"))?.readToEnd).toBe(true);
  });

  test("Reset all learning progress clears opened/read markers", async ({ page }) => {
    const collector = await startErrorCollector(page);
    await page.goto("/chapters/15-api-reference", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(async () => (await chapterState(page, "15-api-reference"))?.readToEnd).toBe(true);

    page.on("dialog", (d) => d.accept());
    await page.locator("#progress-reset").click();
    await expect.poll(async () => (await chapterState(page, "15-api-reference"))).toBeUndefined();
    await collector.assertClean();
  });
});