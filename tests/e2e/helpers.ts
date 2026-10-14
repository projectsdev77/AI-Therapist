import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Accepts the consent sheet after choosing Talk or Write on the home page. */
export async function startConversation(page: Page, mode: "Talk" | "Write") {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(`^${mode}`) }).first().click();
  await page.getByLabel("I'm 18 or older").check();
  await page.getByRole("button", { name: "Let's begin" }).click();
  await page.waitForURL(`**/talk?mode=${mode === "Talk" ? "voice" : "text"}`);
}

export async function say(page: Page, text: string) {
  const box = page.getByLabel("Write to your companion");
  await box.fill(text);
  await box.press("Enter");
  // Wait for the companion's reply to finish streaming.
  await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
  await page.waitForFunction(
    () => !document.querySelector(".caption-line .pulse-dot") && !document.querySelector('[role="status"][aria-label="Thinking"]'),
    undefined,
    { timeout: 15_000 },
  );
}

/** No serious or critical accessibility violations (WCAG 2.2 AA rules). */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}
