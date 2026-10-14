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
