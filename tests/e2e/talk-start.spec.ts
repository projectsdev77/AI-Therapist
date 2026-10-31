import { expect, test } from "./fixtures";

test.use({
  permissions: ["microphone"],
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
});

test("Talk on Home starts talking right away, with no second tap", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "fake microphone flags are Chromium-only");
  await page.goto("/home");
  await page.getByRole("button", { name: /Talk to Haven|^Talk$/ }).first().click();
  await page.getByLabel("I'm 18 or older").check();
  await page.getByRole("button", { name: "Let's begin" }).click();
  await page.waitForURL("**/talk?mode=voice");
  // Without auto-start this invitation would wait for a tap on the mic.
  await expect(page.getByText(/I'll say hello first\. (Tap|Press) the mic/)).toHaveCount(0, { timeout: 10_000 });
});
