import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

/**
 * Each test gets its own client address, so the server's per-address rate limit
 * (src/lib/server/rateLimit.ts) applies per test rather than to the whole parallel run.
 */
export const test = base.extend<{ clientAddress: void }>({
  clientAddress: [
    async ({ context }, use, testInfo) => {
      let h = 0;
      for (const c of `${testInfo.project.name}:${testInfo.testId}:${testInfo.repeatEachIndex}:${testInfo.retry}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      await context.setExtraHTTPHeaders({ "x-forwarded-for": `10.${(h >> 16) & 255}.${(h >> 8) & 255}.${h & 255}` });
      await use();
    },
    { auto: true },
  ],
});
