import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["evals/**/*.eval.ts"],
    testTimeout: 120_000,
    // Gemini's free tier allows only a few requests a minute: EVAL_CONCURRENCY=1.
    maxConcurrency: Number(process.env.EVAL_CONCURRENCY ?? 6),
  },
});
