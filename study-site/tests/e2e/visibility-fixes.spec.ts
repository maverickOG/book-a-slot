import { test, expect } from "@playwright/test";
import { migrations } from "../../src/data/migrations";

test.describe("P3/P4/P5 visibility fixes", () => {
  test("WB-001 | Code Puzzle panels are equal height and stable-gutter at 2xl", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto("/playground", { waitUntil: "networkidle" });

    const puzzle = page.locator("section", { hasText: "Code puzzle" }).first();
    const pres = puzzle.locator("pre");
    expect(await pres.count()).toBe(2);

    const boxes = await pres.evaluateAll((els) =>
      els.map((el) => ({
        h: el.clientHeight,
        w: el.clientWidth,
        gutter: getComputedStyle(el).scrollbarGutter,
      })),
    );
    // equal panels: same height, same width, stable scrollbar gutter
    expect(Math.abs(boxes[0].h - boxes[1].h)).toBeLessThanOrEqual(1);
    expect(Math.abs(boxes[0].w - boxes[1].w)).toBeLessThanOrEqual(1);
    expect(boxes[0].gutter).toBe("stable");
    expect(boxes[1].gutter).toBe("stable");

    // stacked header alignment is untouched: headers render one per figure
    expect(await puzzle.locator("figure figcaption").count()).toBe(2);
  });

  test("WB-002 | chapter-08 status diagram does not overflow its card at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/chapters/08-booking-lifecycle", { waitUntil: "networkidle" });

    const fig = page.locator("figure", { hasText: "The flow of states" }).first();
    await expect(fig).toBeVisible();
    const ok = await fig.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
    expect(ok, "status diagram should not overflow horizontally at 390px").toBe(true);
  });

  test("WB-003 | schema and docker diagrams keep content inside their figures at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/reference/models", { waitUntil: "networkidle" });
    const schema = page.locator("figure", { hasText: "users" }).first();
    await expect(schema).toBeVisible();
    expect(await schema.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);

    await page.goto("/chapters/11-docker-basics", { waitUntil: "networkidle" });
    const dock = page.locator("figure", { hasText: "postgres:16-alpine" }).first();
    await expect(dock).toBeVisible();
    expect(await dock.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  });

  test("WB-004 | migrations list and timeline lead with the human title, not the raw id", async ({ page }) => {
    await page.goto("/reference/migrations", { waitUntil: "networkidle" });

    // The <details> summary must open with the human title first.
    const firstSummary = page.locator("details summary").first();
    const firstSpan = firstSummary.locator("span").first();
    await expect(firstSpan).toHaveText(migrations[0].title);
    const summaryText = (await firstSummary.innerText()).split("\n")[0];
    expect(summaryText.includes(migrations[0].title)).toBe(true);

    // The timeline card's title row must also lead with the human title.
    const firstNode = page.locator("figure.my-6 > ol > li").first();
    const card = firstNode.locator("div.rounded-xl");
    await expect(card).toBeVisible();
    const titleRow = card.locator("div.flex.flex-wrap").first();
    await expect(titleRow.locator("p").first()).toHaveText(migrations[0].title);
  });

  test("WB-005 | long chapter titles wrap in the sidebar instead of being truncated", async ({ page }) => {
    await page.goto("/chapters/08-booking-lifecycle", { waitUntil: "networkidle" });

    const titles = page.locator("a.chapter-link .chapter-title");
    const count = await titles.count();
    expect(count).toBeGreaterThanOrEqual(13);

    const failures: number[] = [];
    for (let i = 0; i < count; i++) {
      const truncated = await titles.nth(i).evaluate((el) => {
        const cs = getComputedStyle(el);
        return el.scrollWidth > el.clientWidth + 1 || cs.textOverflow === "ellipsis" || cs.whiteSpace === "nowrap";
      });
      if (truncated) failures.push(i);
    }
    expect(failures, `truncated sidebar titles at indexes ${failures.join(",")}`).toEqual([]);
  });
});