import { expect, test } from "./fixtures";
import { expectAccessible, say, startConversation } from "./helpers";

test("a safety plan is made in the person's own words and kept", async ({ page }) => {
  await page.goto("/safety-plan");
  await expect(page.getByRole("heading", { name: /My warning signs/ })).toBeVisible();
  await page.getByLabel("Add to: My warning signs").fill("Not sleeping");
  await page.getByRole("button", { name: "Add to My warning signs" }).click();
  await expect(page.getByText("Not sleeping")).toBeVisible();
  await expectAccessible(page);
  await page.reload();
  await expect(page.getByText("Not sleeping")).toBeVisible();
});

test("mood is rated after the greeting and at Wrap up, with \"Did you feel heard?\"", async ({ page }) => {
  await startConversation(page, "Write");
  const start = page.getByRole("radiogroup", { name: "How are you feeling right now?" });
  await expect(start).toBeVisible({ timeout: 15_000 });
  await start.getByRole("radio", { name: "3 out of 10" }).click();
  await expect(start).toHaveCount(0);
  await say(page, "Work has been so stressful lately.");
  await page.getByRole("button", { name: "Wrap up this conversation" }).click();
  const sheet = page.getByRole("alertdialog", { name: "Wrap up and make your card?" });
  await sheet.getByRole("radiogroup", { name: "How are you feeling now?" }).getByRole("radio", { name: "7 out of 10" }).click();
  await sheet.getByRole("radio", { name: "Yes" }).click();
  await expectAccessible(page);
  await sheet.getByRole("button", { name: "Wrap up and make my card" }).click();
  await expect(page.locator("#reflection-card")).toBeVisible({ timeout: 15_000 });
  // A lift from 3 to 7 is "Rain, then clearing", from the person's own ratings.
  await expect(page.getByText(/Rain, then clearing · chosen by you/)).toBeVisible();
});

test("\"Not quite\" asks what's off", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Work has been so stressful lately.");
  await page.getByRole("button", { name: "Wrap up this conversation" }).click();
  await page.getByRole("button", { name: "Wrap up and make my card" }).click();
  await expect(page.locator("#reflection-card")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Not quite" }).click();
  await expect(page.getByLabel(/What's off\?/)).toBeVisible();
  await page.getByLabel(/What's off\?/).fill("It was really about my dad");
  await page.getByRole("button", { name: "Rewrite my card" }).click();
  await expect(page.getByLabel(/What's off\?/)).toHaveCount(0, { timeout: 15_000 });
});

test("exercises: grounding steps through, and first-appointment notes can be drafted", async ({ page }) => {
  await page.goto("/exercises");
  await page.getByRole("button", { name: /5-4-3-2-1 grounding/ }).click();
  await expect(page.getByRole("heading", { name: "Let's come back to right here" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Notice 5 things you can see" })).toBeVisible();
  await expectAccessible(page);

  await page.goto("/prepare");
  await page.getByRole("button", { name: "Draft my notes" }).click();
  await expect(page.getByLabel("What's been going on")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel("Questions to ask")).not.toHaveValue("");
  await expectAccessible(page);
});
