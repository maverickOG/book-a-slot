import { test, expect } from "@playwright/test";

test.describe("Reference dropdown top-level navigation", () => {
  test("trigger exists with correct semantics", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const trigger = page.locator("#reference-trigger");
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-haspopup", "true");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-controls", "reference-menu");
    await expect(page.locator("#reference-menu")).toBeAttached();
  });

  test("E2E-REFERENCE-MENU-POINTER-001 | opens on click (not hover), closes on outside click, items navigate", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const trigger = page.locator("#reference-trigger");
    const menu = page.locator("#reference-menu");

    // pointer hover must NOT open the menu (it is click-controlled)
    await trigger.hover();
    await expect(menu).toBeHidden();

    // click opens it
    await trigger.click();
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("menuitem", { name: "API reference" })).toBeVisible();

    // clicking outside closes it again
    await page.getByRole("link", { name: "Inside Book a Slot — home" }).click();
    await expect(menu).toBeHidden();

    // reopen and navigate via a menu item
    await trigger.click();
    await page.getByRole("menuitem", { name: "API reference" }).click();
    await expect(page).toHaveURL(/\/reference\/api$/);
  });

  test("E2E-REFERENCE-MENU-KEYBOARD-001 | Enter opens, Escape closes and refocuses the trigger", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const trigger = page.locator("#reference-trigger");
    const menu = page.locator("#reference-menu");

    await trigger.focus();
    await expect(menu).toBeHidden();

    // Enter opens and moves focus to the first menu item
    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible();
    const firstRole = await page.evaluate(() => document.activeElement?.getAttribute("role"));
    expect(firstRole).toBe("menuitem");

    // Escape closes and returns focus to the trigger
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    const focusedId = await page.evaluate(() => document.activeElement?.getAttribute("id"));
    expect(focusedId).toBe("reference-trigger");
  });

  test("clicking API reference navigates and marks the active item", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const trigger = page.locator("#reference-trigger");

    await trigger.click();
    await page.getByRole("menuitem", { name: "API reference" }).click();
    await expect(page).toHaveURL(/\/reference\/api$/);

    // on the new page the menu is closed; open it to inspect the marker
    await trigger.click();
    const apiItem = page.getByRole("menuitem", { name: "API reference" });
    await expect(apiItem).toHaveAttribute("aria-current", "page");
    await expect(trigger).toHaveClass(/bg-indigo-50/);
  });

  test("clicking Data models and Migrations each go to their own page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const trigger = page.locator("#reference-trigger");

    await trigger.click();
    await page.getByRole("menuitem", { name: "Data models" }).click();
    await expect(page).toHaveURL(/\/reference\/models$/);
    await trigger.click();
    await expect(page.getByRole("menuitem", { name: "Data models" })).toHaveAttribute("aria-current", "page");

    // menu is still open from the assertion above; go straight to Migrations
    await page.getByRole("menuitem", { name: "Migrations" }).click();
    await expect(page).toHaveURL(/\/reference\/migrations$/);
    await trigger.click();
    await expect(page.getByRole("menuitem", { name: "Migrations" })).toHaveAttribute("aria-current", "page");
  });

  test("desktop nav shows Reference child marked active directly", async ({ page }) => {
    await page.goto("/reference/models", { waitUntil: "networkidle" });
    // menu is closed on load; open it to inspect the marker
    await page.locator("#reference-trigger").click();
    await expect(page.getByRole("menuitem", { name: "Data models" })).toHaveAttribute("aria-current", "page");
  });

  test("Escape closes the dropdown and refocuses the trigger", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const trigger = page.locator("#reference-trigger");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#reference-menu")).toBeHidden();
    const focusedId = await page.evaluate(() => document.activeElement?.getAttribute("id"));
    expect(focusedId).toBe("reference-trigger");
  });
});