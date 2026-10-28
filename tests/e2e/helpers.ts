import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** From the landing page: choose Talk or Write and accept the consent sheet. */
export async function startConversation(page: Page, mode: "Talk" | "Write") {
  await page.goto("/");
  await page.getByRole("button", { name: mode, exact: true }).first().click();
  await page.getByLabel("I'm 18 or older").check();
  await page.getByRole("button", { name: "Let's begin" }).click();
  await page.waitForURL(`**/talk?mode=${mode === "Talk" ? "voice" : "text"}`);
}

const replies = (page: Page) => page.locator("main[data-replies]").getAttribute("data-replies").then(Number);

/** Waits until the companion has finished its next reply. */
export async function waitForReply(page: Page, before: number) {
  await expect.poll(() => replies(page), { timeout: 15_000 }).toBeGreaterThan(before);
  await expect(page.locator("main[data-phase]")).toHaveAttribute("data-phase", "idle", { timeout: 15_000 });
}

/** Writes a message and waits for the companion's whole reply. */
export async function say(page: Page, text: string) {
  // Let the greeting finish first so the reply count is stable.
  await expect(page.locator("main[data-phase]")).toHaveAttribute("data-phase", "idle", { timeout: 15_000 });
  const before = await replies(page);
  const box = page.getByLabel("Write to your companion");
  await box.fill(text);
  await box.press("Enter");
  await waitForReply(page, before);
}

/** Wrap up from the tools row and make the card. */
export async function wrapUp(page: Page) {
  await page.getByRole("button", { name: "Wrap up this conversation" }).click();
  await page.getByRole("button", { name: "Wrap up and make my card" }).click();
}

/** No serious or critical accessibility violations (WCAG 2.2 AA rules). */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}
