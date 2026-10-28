import { expect, test } from "@playwright/test";
import { say, startConversation } from "./helpers";

test("acute risk opens support without ending the conversation", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "I think I want to kill myself");

  const panel = page.getByRole("region", { name: "You don't have to carry this alone" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link", { name: /call/i }).first()).toBeVisible();
  // Nothing covers the composer.
  await expect(page.getByLabel("Write to your companion")).toBeInViewport();
  await expect(page.getByText(/Are you safe right now\?/).first()).toBeVisible();
  await expect(page.locator("[data-presence-state]:visible").first()).toHaveAttribute("data-presence-state", "concerned");

  // The person can keep talking.
  await expect(page.getByLabel("Write to your companion")).toBeEnabled();
  await panel.getByRole("button", { name: "I'm safe right now" }).click();
  // Support stays one tap away.
  await expect(page.getByRole("button", { name: "Support options" })).toBeVisible();
});

test("elevated risk offers support gently", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Honestly I don't want to be alive anymore");
  await page.getByRole("button", { name: "Support options" }).click();
  await expect(page.getByRole("dialog", { name: "Talk to a person now" })).toBeVisible();
});
