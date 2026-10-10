import { expect, test } from "@playwright/test";
import { expectAccessible, say, startConversation } from "./helpers";

test("a written conversation becomes a reflection, a sky, and memories", async ({ page }) => {
  await startConversation(page, "Write");
  await expect(page.getByText("What's on your mind today?").first()).toBeVisible();
  await expectAccessible(page);

  await say(page, "Work has been so stressful, my boss keeps adding deadlines.");
  await say(page, "I can't sleep, I keep replaying meetings at night.");

  await page.getByRole("button", { name: "Show conversation" }).click();
  await expect(page.getByRole("dialog", { name: "Conversation transcript" }).getByText("my boss keeps adding deadlines")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "End", exact: true }).click();
  await page.waitForURL("**/history/**");
  const card = page.locator("#reflection-card");
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card.getByText("work", { exact: true })).toBeVisible();
  await expectAccessible(page);

  await page.goto("/history");
  await expect(page.getByRole("link", { name: /Talking through work/ })).toBeVisible();

  await page.goto("/memory");
  await expect(page.getByText("Has been talking about work")).toBeVisible();
  await page.getByRole("button", { name: "Forget: Has been talking about work" }).click();
  await expect(page.getByText("Has been talking about work")).toHaveCount(0);

  await page.goto("/");
  await expect(page.getByText("How are you, really?")).toBeVisible();
  await expect(page.getByText("Last time")).toBeVisible();
});

test("the companion remembers you next time", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Work has been overwhelming lately.");
  await page.getByRole("button", { name: "End", exact: true }).click();
  await expect(page.locator("#reflection-card")).toBeVisible({ timeout: 15_000 });

  await page.goto("/talk?mode=text");
  await expect(page.getByText(/Welcome back\. Last time we talked about/).first()).toBeVisible();
});
