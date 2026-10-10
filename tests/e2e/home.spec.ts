import { expect, test } from "@playwright/test";
import { expectAccessible } from "./helpers";

test("home invites you to talk or write, with help always visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hello. I'm here to listen." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Talk", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Write", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Get help" })).toBeVisible();
  await expect(page.getByText("is an AI companion, not a therapist")).toBeVisible();
  await expectAccessible(page);
});

test("consent requires confirming you're an adult", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Write", exact: true }).click();
  const accept = page.getByRole("button", { name: "I understand" });
  await expect(accept).toBeDisabled();
  await expect(page.getByText("I remember our conversations.")).toBeVisible();
  await page.getByLabel("I'm 18 or older").check();
  await expect(accept).toBeEnabled();
});

test("Get help shows crisis lines", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Get help" }).click();
  await expect(page.getByRole("dialog", { name: "Get help now" })).toBeVisible();
  await expect(page.getByRole("link", { name: /call/i }).first()).toBeVisible();
  await expectAccessible(page);
});
