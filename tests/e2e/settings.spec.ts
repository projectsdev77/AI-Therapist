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
  await page.getByRole("switch").uncheck();
  await page.goto("/memory");
  await expect(page.getByText("Memory is off.")).toBeVisible();
  await page.getByRole("button", { name: "Turn memory on" }).click();
  await expect(page.getByText("Memory is off.")).toHaveCount(0);
});

test("delete everything needs a typed confirmation", async ({ page }) => {
  await startConversation(page, "Write");
  await say(page, "Just testing.");
  await page.goto("/settings");
  const button = page.getByRole("button", { name: "Delete everything" });
  await expect(button).toBeDisabled();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await button.click();
  await page.waitForURL("**/");
  await page.goto("/history");
  await expect(page.getByText("No conversations yet.")).toBeVisible();
});
