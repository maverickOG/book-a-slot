import { test, expect, type Page } from "@playwright/test";
import { startErrorCollector } from "./helpers";

test.describe("Playground interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground", { waitUntil: "networkidle" });
  });

  test("Request Simulator: endpoint switch updates request and outcomes", async ({ page }) => {
    const collector = await startErrorCollector(page);
    const sim = page.locator("section", { hasText: "Static request simulator" });

    // endpoint list exists with all 12 endpoints
    const endpointList = page.locator(".md\\:grid-cols-\\[minmax\\(0\\,19rem\\)_1fr\\] > ul");
    await expect(endpointList).toBeVisible();

    // default first endpoint = POST /auth/signup (visible in the endpoint list)
    await expect(endpointList.locator("text=/POST/").first()).toBeVisible();

    // pick POST /auth/login → request panel changes
    await page.getByRole("button", { name: /POST \/auth\/login/ }).click();
    await expect(page.locator(".bg-slate-900").first()).toContainText("/auth/login");

    // pick an outcome scenario → response panel renders (scoped to the simulator section)
    await page.getByRole("button", { name: "200 { access_token, token_type: 'bearer' }" }).click();
    await expect(page.getByText("HTTP 200")).toBeVisible();
    await expect(sim.locator(".bg-slate-50").last()).toContainText("access_token");

    // switch endpoint resets scenario (response hidden)
    await page.getByRole("button", { name: /GET \/auth\/me/ }).click();
    await expect(page.getByText("HTTP 200")).toBeHidden();

    // DELETE shows 204 empty body note when its scenario chosen
    await page.getByRole("button", { name: /DELETE \/bookings/ }).click();
    await page.getByRole("button", { name: "204 no content" }).click();
    await expect(page.getByText("204 — empty body")).toBeVisible();

    await collector.assertClean();
  });

  test("Request Simulator: auth line reflects selected endpoint", async ({ page }) => {
    await page.getByRole("button", { name: /POST \/bookings$/ }).click(); // create slot = provider
    await expect(page.locator("text=auth: Bearer · provider")).toBeVisible();

    await page.getByRole("button", { name: /POST \/reviews$/ }).click();
    await expect(page.locator("text=auth: Bearer · customer")).toBeVisible();
  });

  test("Which is real: both options are clickable and give correct verdict", async ({ page }) => {
    const collector = await startErrorCollector(page);
    const section = page.getByText("Code puzzle · which one is the real repo code?").locator("..");

    const buttons = section.locator("figure button");
    await expect(buttons).toHaveCount(2);

    // first figure (the real code, option A) → correct verdict
    await buttons.first().click();
    await expect(section.getByText("That's the real code.")).toBeVisible();

    // click a second figure after a reload (reset the component via nav)
    await page.reload({ waitUntil: "networkidle" });
    const section2 = page.getByText("Code puzzle · which one is the real repo code?").locator("..");
    await section2.locator("figure button").last().click();
    await expect(section2.getByText("The other one is real.")).toBeVisible();

    await collector.assertClean();
  });

  test("Order steps: build the correct sequence and get positive feedback", async ({ page }) => {
    const collector = await startErrorCollector(page);
    const section = page.getByText("Order the steps").first().locator("..");

    // correct order = the 6 canonical steps in their authored order
    const canonical = [
      "get_current_user parses the bearer token",
      "404 if the booking does not exist",
      "409 if the booking isn't completed",
      "403 if you aren't the booking's customer",
      "409 if the booking is already reviewed",
      "201 Created with the stored review",
    ];

    for (const step of canonical) {
      await section.getByRole("button", { name: step }).click();
    }

    await section.getByRole("button", { name: "Check" }).click();
    await expect(section.getByText("Correct order!")).toBeVisible();
    await expect(section.getByRole("button", { name: "remove step" })).toHaveCount(6);
    await collector.assertClean();
  });

  test("Order steps: wrong order gets corrective feedback and reset clears it", async ({ page }) => {
    const section = page.getByText("Order the steps").first().locator("..");

    // pick every step in the order they appear (shuffled) → not the canonical order
    const available = section.locator("div.flex.flex-wrap.gap-2 button");
    const count = await available.count();
    expect(count).toBe(6);
    for (let i = 0; i < count; i++) {
      await section.locator("div.flex.flex-wrap.gap-2 button").first().click();
    }

    await section.getByRole("button", { name: "Check" }).click();
    await expect(section.getByText(/Not quite/)).toBeVisible();

    await section.getByRole("button", { name: "Reset" }).click();
    await expect(section.getByText("Tap steps on the right to build the sequence.")).toBeVisible();
  });

  test("Order steps: remove step works and Check stays disabled until complete", async ({ page }) => {
    const section = page.getByText("Order the steps").first().locator("..");
    const check = section.getByRole("button", { name: "Check" });
    await expect(check).toBeDisabled();

    const canonical = [
      "get_current_user parses the bearer token",
      "404 if the booking does not exist",
      "409 if the booking isn't completed",
      "403 if you aren't the booking's customer",
      "409 if the booking is already reviewed",
      "201 Created with the stored review",
    ];

    // select 3 canonical steps, remove one, then fill the rest
    for (const step of canonical.slice(0, 3)) {
      await section.getByRole("button", { name: step }).click();
      await expect(check).toBeDisabled();
    }
    await expect(section.getByRole("button", { name: "remove step" })).toHaveCount(3);
    await section.getByRole("button", { name: "remove step" }).first().click();
    await expect(check).toBeDisabled();
    expect(await section.getByRole("button", { name: "remove step" }).count()).toBe(2);

    for (const step of canonical.slice(3)) {
      await section.getByRole("button", { name: step }).click();
    }
    await section.getByRole("button", { name: canonical[0] }).click();
    expect(await section.getByRole("button", { name: "remove step" }).count()).toBe(6);
    await expect(check).toBeEnabled();
  });
});