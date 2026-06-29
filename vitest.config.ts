import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./packages/test-utils/setup.ts"],
    include: ["packages/**/*.test.{ts,tsx}", "apps/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["packages/calculators-engine/**/*.ts", "packages/tools-engine/**/*.ts", "packages/storage/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/registry.ts"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 },
    },
  },
});
