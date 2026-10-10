import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";

describe("brand", () => {
  it("never markets the product as therapy", () => {
    const copy = `${BRAND.name} ${BRAND.tagline} ${BRAND.description}`.toLowerCase();
    expect(copy).not.toMatch(/therap|treatment|diagnos/);
  });
});
