import { expect, test } from "@playwright/test";
import { expectAccessible, say, startConversation } from "./helpers";

test("settings are grouped and accessible", async ({ page }) => {
  await page.goto("/settings");
  for (const g of ["Account", "Conversations", "Your data", "About"]) await expect(page.getByRole("heading", { name: g })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Match my sky" })).toBeDisabled();
  await expectAccessible(page);
});

test("turning memory off is shown plainly on the memory page", async ({ page }) => {
  await page.goto("/memory");
  const sw = page.getByRole("switch", { name: "Remember our conversations" });
  await sw.click();
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText("Remembering is off.")).toBeVisible();
  await sw.click();
  await expect(page.getByText("I keep short notes so you don't have to start over.")).toBeVisible();
  await expectAccessible(page);
});

test("delete everything needs a typed confirmation", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Just testing.");
  await page.goto("/settings");
  await page.getByRole("button", { name: /^Delete everything/ }).click();
  const dialog = page.getByRole("alertdialog", { name: "Delete everything?" });
  const button = dialog.getByRole("button", { name: "Delete everything" });
  await expect(button).toBeDisabled();
  await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
  await button.click();
  await page.waitForURL("**/home");
  await page.goto("/history");
  await expect(page.getByText("Your first sky is waiting")).toBeVisible();
});

test("ambient sound is a per-device setting and plays alongside a conversation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Count audio contexts so we can tell the ambient engine started.
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    (window as unknown as { __audioContexts: number }).__audioContexts = 0;
    window.AudioContext = class extends Original {
      constructor(opts?: AudioContextOptions) {
        super(opts);
        (window as unknown as { __audioContexts: number }).__audioContexts++;
      }
    };
  });

  await page.goto("/settings");
  await page.getByRole("switch", { name: "Ambient sound" }).check();
  await page.getByLabel("Sound", { exact: true }).selectOption("hum");
  await page.reload();
  await expect(page.getByRole("switch", { name: "Ambient sound" })).toBeChecked();
  await expect(page.getByLabel("Sound", { exact: true })).toHaveValue("hum");
  await expectAccessible(page);

  await startConversation(page, "Write");
  await say(page, "Work has been stressful lately.");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __audioContexts: number }).__audioContexts)).toBeGreaterThan(0);
  await expect(page.getByText("Work has been stressful lately.").first()).toBeVisible();
  expect(errors).toEqual([]);
});
