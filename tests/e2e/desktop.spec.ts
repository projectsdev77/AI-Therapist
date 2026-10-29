import { expect, test } from "./fixtures";
import { expectAccessible, say, startConversation, waitForReply, wrapUp } from "./helpers";

// The desktop app shell (1024px and up): sidebar, page, side panel. Runs in the "desktop" project.

test("first visit: Home in the shell, with what to expect and the consent grid", async ({ page }) => {
  await page.goto("/home");
  const sidebar = page.getByRole("complementary", { name: "Sidebar" });
  await expect(sidebar.getByRole("button", { name: /New conversation/ })).toBeVisible();
  await expect(sidebar.getByText("Your conversations will appear here")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Somewhere quiet to think out loud" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "What to expect" })).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("button", { name: "Talk", exact: true }).click();
  const consent = page.getByRole("dialog", { name: "Before we begin" });
  await expect(consent.getByText("You stay in control.")).toBeVisible();
  await expect(consent.getByRole("switch", { name: "Remember our conversations" })).toBeChecked();
  await expect(consent.getByRole("button", { name: "Let's begin" })).toBeDisabled();
  await expectAccessible(page);
});

test("writing from Home starts the conversation with those words", async ({ page }) => {
  await page.goto("/home");
  await page.getByLabel("Write what's on your mind").fill("Work has been so stressful lately.");
  await page.keyboard.press("Enter");
  await page.getByLabel("I'm 18 or older").check();
  await page.getByRole("button", { name: "Let's begin" }).click();
  await page.waitForURL("**/talk?mode=text");
  await waitForReply(page, 0);
  await expect(page.getByText("Work has been so stressful lately.")).toBeVisible();
  // No greeting first: the person's words open the conversation.
  await expect(page.getByRole("group", { name: "Ways to start" })).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Sidebar" }).getByRole("link", { name: /Unfinished conversation/ })).toBeVisible();
  await expectAccessible(page);
});

test("the side panel holds reply style, Get help, and the care panel", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Work has been so stressful.");

  const panel = page.getByRole("complementary", { name: "This conversation" });
  await panel.getByRole("radio", { name: /Just listen/ }).click();
  await expect(panel.getByRole("radio", { name: /Just listen/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Okay. I'll just listen.")).toBeVisible();

  // Get help replaces the panel, and the conversation stays beside it.
  await panel.getByRole("button", { name: "Get help" }).click();
  const help = page.getByRole("complementary", { name: "Get help" });
  await expect(help.getByRole("heading", { name: "Talk to a person now" })).toBeVisible();
  await expect(page.getByLabel("Write to your companion")).toBeVisible();
  await help.getByRole("button", { name: "Close help" }).click();
  await expect(page.getByRole("complementary", { name: "This conversation" })).toBeVisible();

  // Acute risk turns the panel into the care panel by itself.
  await say(page, "I think I want to kill myself");
  const care = page.getByRole("complementary", { name: "Get help" });
  await expect(care.getByRole("heading", { name: "You don't have to carry this alone" })).toBeVisible();
  await expect(page.getByLabel("Write to your companion")).toBeEnabled();
  await expectAccessible(page);
  await care.getByRole("button", { name: "I'm safe right now" }).click();
  await expect(page.getByRole("button", { name: "Support options" })).toBeVisible();
});

test("keyboard: 1–4 choose a style, Esc asks to wrap up", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Something happened today.");
  await page.getByLabel("Write to your companion").blur();
  await page.keyboard.press("4");
  await expect(page.getByRole("radio", { name: /Help me find a next step/ })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog", { name: "Wrap up and make your card?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "I'll be back" })).toBeVisible();
});

test("the card page: Your say in the panel, inline sky picker, edit with E", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Work has been so stressful lately.");
  await wrapUp(page);
  await expect(page.locator("#reflection-card")).toBeVisible({ timeout: 15_000 });

  const panel = page.getByRole("complementary", { name: "Your say" });
  await panel.getByRole("button", { name: /^Sky/ }).click();
  await panel.getByRole("radio", { name: "Quiet" }).click();
  await panel.getByRole("button", { name: "Use this sky" }).click();
  await expect(panel.getByText("Quiet · chosen by you")).toBeVisible();
  await expectAccessible(page);

  await page.keyboard.press("e");
  await page.getByLabel(/^Title/).fill("A long week at work");
  await page.keyboard.press("Control+Enter");
  await expect(page.getByRole("heading", { name: "A long week at work" })).toBeVisible();

  // Your skies: a month calendar; the day's conversations show in the panel.
  await page.getByRole("complementary", { name: "Sidebar" }).getByRole("link", { name: "Your skies" }).click();
  await expect(page.getByRole("button", { name: /1 conversation, Quiet/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("complementary", { name: "Details" }).getByRole("link", { name: /A long week at work/ })).toBeVisible();
  await expectAccessible(page);
});

test("account menu, shortcuts, settings Start in, and the compact layout", async ({ page }) => {
  await page.goto("/home");
  await page.getByRole("button", { name: "Account and settings" }).click();
  await expect(page.getByRole("menu", { name: "Account" })).toBeVisible();
  await page.getByRole("menuitem", { name: /Keyboard shortcuts/ }).click();
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/settings");
  await expect(page.getByLabel("Start in")).toHaveValue("text");
  await page.getByLabel("Start in").selectOption("voice");
  await expect(page.getByLabel("Start in")).toHaveValue("voice");
  await expectAccessible(page);

  // 1024–1279px: icon sidebar, and the panel folds away behind a toggle.
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto("/memory");
  await expect(page.getByRole("complementary", { name: "Memory settings" })).toHaveCount(0);
  await page.getByRole("button", { name: "Show side panel" }).click();
  await expect(page.getByRole("complementary", { name: "Memory settings" })).toBeVisible();
  await expectAccessible(page);
});
