import { expect, test } from "@playwright/test";
import { expectAccessible, say, startConversation } from "./helpers";

test("theme choice persists without a flash", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("radio", { name: "Twilight" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expectAccessible(page);
});

test("turning memory off is reflected on the memory page", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("switch", { name: "Remember between conversations" }).uncheck();
  await page.goto("/memory");
  await expect(page.getByText("Remembering is off.")).toBeVisible();
  await page.getByRole("switch", { name: "Remember between conversations" }).check();
  await expect(page.getByText("Remembering is on")).toBeVisible();
});

test("delete everything needs a typed confirmation", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Just testing.");
  await page.goto("/settings");
  await page.getByRole("button", { name: /^Delete everything/ }).click();
  const dialog = page.getByRole("dialog", { name: "Delete everything" });
  const button = dialog.getByRole("button", { name: "Delete everything" });
  await expect(button).toBeDisabled();
  await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
  await button.click();
  await page.waitForURL("**/");
  await page.goto("/history");
  await expect(page.getByText("No skies yet.")).toBeVisible();
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
