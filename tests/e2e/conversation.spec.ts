import { expect, test } from "./fixtures";
import { expectAccessible, say, startConversation, waitForReply, wrapUp } from "./helpers";

test("a written conversation becomes a reflection, a sky, and memories", async ({ page }) => {
  await startConversation(page, "Write");
  await expect(page.getByText("What's on your mind today?").first()).toBeVisible();
  await expectAccessible(page);

  await say(page, "Work has been so stressful, my boss keeps adding deadlines.");
  await say(page, "I can't sleep, I keep replaying meetings at night.");

  await page.getByRole("button", { name: "Transcript" }).click();
  await expect(page.getByRole("dialog", { name: "Transcript" }).getByText("my boss keeps adding deadlines")).toBeVisible();
  await page.keyboard.press("Escape");

  await wrapUp(page);
  await page.waitForURL("**/history/**");
  const card = page.locator("#reflection-card");
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(card.getByText("work", { exact: true })).toBeVisible();
  await expectAccessible(page);

  await page.goto("/history");
  await expect(page.getByRole("link", { name: /Talking through work/ })).toBeVisible();

  await page.goto("/memory");
  await expect(page.getByText("You've been talking about work")).toBeVisible();
  await page.getByRole("button", { name: "Forget: You've been talking about work" }).click();
  await expect(page.getByText("You've been talking about work")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();

  // A returning visitor skips the landing page.
  await page.goto("/");
  await page.waitForURL("**/home");
  await expect(page.getByRole("heading", { name: "How are you, really?" })).toBeVisible();
  await expect(page.getByText(/Last time/)).toBeVisible();
});

test("the companion remembers you next time", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Work has been overwhelming lately.");
  await wrapUp(page);
  await expect(page.locator("#reflection-card")).toBeVisible({ timeout: 15_000 });

  await page.goto("/talk?mode=text");
  await expect(page.getByText(/Welcome back\. Last time we talked about/).first()).toBeVisible();
});

test("sending right away, or twice quickly, never duplicates replies", async ({ page }) => {
  await startConversation(page, "Write");
  const box = page.getByLabel("Write to your companion");
  await box.fill("Work has been so stressful.");
  await box.press("Enter");
  await box.fill("And I can't sleep.");
  await box.press("Enter");
  await page.waitForTimeout(4000);
  await expect(page.locator("[data-phase]")).toHaveAttribute("data-phase", "idle", { timeout: 15_000 });

  await page.getByRole("button", { name: "Transcript" }).click();
  const lines = await page.getByRole("list", { name: "Conversation transcript" }).locator("li").allInnerTexts();
  const user = lines.filter((l) => l.startsWith("You"));
  const companion = lines.filter((l) => l.startsWith("Haven"));
  expect(user).toHaveLength(2);
  expect(new Set(companion).size).toBe(companion.length);
  // The last line is a complete reply to the last message.
  expect(lines.at(-1)).toMatch(/^Haven/);
});

test("a starter opens the conversation, and starters then go away", async ({ page }) => {
  await startConversation(page, "Write");
  const starters = page.getByRole("group", { name: "Ways to start" });
  await expect(starters).toBeVisible();
  await expect(page.locator("[data-phase]")).toHaveAttribute("data-phase", "idle", { timeout: 15_000 });
  await starters.getByRole("button", { name: "I just need to vent" }).click();
  await waitForReply(page, 1);
  await expect(page.getByText("I just need to vent.")).toBeVisible();
  await expect(starters).toHaveCount(0);
  // The vent starter also sets the reply style to Just listen.
  await expect(page.getByRole("button", { name: "Reply style: Just listen" })).toBeVisible();
});

test("choosing a reply style is acknowledged quietly", async ({ page }) => {
  await startConversation(page, "Write");
  await page.getByRole("button", { name: "Reply style" }).click();
  const sheet = page.getByRole("dialog", { name: "What would help right now?" });
  await expect(sheet.getByRole("radio", { name: /Whatever feels right/ })).toHaveAttribute("aria-checked", "true");
  await expectAccessible(page);
  await sheet.getByRole("radio", { name: /Help me find a next step/ }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByText("Okay. Let's look for one small next step.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reply style: Help me find a next step" })).toBeVisible();
});

test("I'll be back leaves the conversation open to pick up later", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Something happened at work I keep thinking about.");
  await page.getByRole("button", { name: "Wrap up this conversation" }).click();
  await expect(page.getByRole("alertdialog", { name: "Wrap up and make your card?" })).toBeVisible();
  await page.getByRole("button", { name: "I'll be back" }).click();
  await page.waitForURL("**/home");

  await page.getByRole("link", { name: /Pick up/ }).click();
  await page.waitForURL("**/talk?resume=**");
  await expect(page.getByText("Something happened at work I keep thinking about.")).toBeVisible();
  // No new greeting: the conversation continues where it was.
  await expect(page.getByRole("group", { name: "Ways to start" })).toHaveCount(0);
});

test("the person can correct the card: feedback, words, and sky", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Work has been so stressful lately.");
  await wrapUp(page);
  await expect(page.locator("#reflection-card")).toBeVisible({ timeout: 15_000 });

  const notQuite = page.getByRole("button", { name: "Not quite" });
  await notQuite.click();
  await expect(notQuite).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /Edit this card/ }).click();
  await page.getByLabel(/^Title/).fill("A long week at work");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "A long week at work" })).toBeVisible();

  await page.getByRole("button", { name: /^Sky/ }).click();
  await page.getByRole("radio", { name: "Quiet" }).click();
  await page.getByRole("button", { name: "Use this sky" }).click();
  await expect(page.getByText("Quiet · chosen by you")).toBeVisible();
  await expectAccessible(page);

  await page.goto("/history");
  await expect(page.getByRole("link", { name: /A long week at work/ })).toContainText("chosen by you");
});

test("a card that didn't get made is finished on the next visit", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Work has been so stressful lately.");
  // Simulate the tab closing before the card is made: every attempt fails.
  await page.route("**/api/reflect", (route) => route.abort());
  await wrapUp(page);
  await page.waitForURL("**/history/**");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible({ timeout: 15_000 });
  await page.unroute("**/api/reflect");

  // Next visit: the app finishes it in the background.
  const made = page.waitForResponse((r) => r.url().endsWith("/api/reflect") && r.ok(), { timeout: 15_000 });
  await page.goto("/home");
  await made;
  // Let the card and memories finish saving before leaving the page.
  await page.waitForTimeout(2_000);
  await page.goto("/history");
  await expect(page.getByRole("link", { name: /Talking through work/ })).toBeVisible({ timeout: 10_000 });
});
