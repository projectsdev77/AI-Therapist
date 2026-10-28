import { expect, test } from "@playwright/test";
import { expectAccessible } from "./helpers";

test("the landing page says what it is, offers Talk and Write, and keeps help in reach", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Somewhere quiet to think out loud" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Talk", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Write", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Get help" }).first()).toBeVisible();
  await expect(page.getByText("An AI, not a therapist")).toBeVisible();
  await expect(page.getByText("Not for emergencies")).toBeVisible();
  await expectAccessible(page);
});

test("Home has the dock and the disclaimer", async ({ page }) => {
  await page.goto("/home");
  await expect(page.getByRole("heading", { name: "Somewhere quiet to think out loud" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Talk to Haven" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Write instead" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Help me slow down" })).toBeVisible();
  await expect(page.getByText("isn't a clinician or an emergency service")).toBeVisible();
  await expectAccessible(page);
});

test("consent requires confirming you're an adult, with memory on by default", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Write", exact: true }).first().click();
  const accept = page.getByRole("button", { name: "Let's begin" });
  await expect(accept).toBeDisabled();
  await expect(page.getByText("I'll remember what matters.")).toBeVisible();
  await expect(page.getByRole("switch", { name: "Remember our conversations" })).toBeChecked();
  await expectAccessible(page);
  await page.getByLabel("I'm 18 or older").check();
  await expect(accept).toBeEnabled();
});

test("Get help shows crisis lines", async ({ page }) => {
  await page.goto("/home");
  await page.getByRole("button", { name: "Get help" }).click();
  await expect(page.getByRole("dialog", { name: "Talk to a person now" })).toBeVisible();
  await expect(page.getByRole("link", { name: /call/i }).first()).toBeVisible();
  await expectAccessible(page);
});
