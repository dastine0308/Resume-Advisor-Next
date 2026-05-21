import { defineConfig } from "vitest/config";
import path from "path";
import { loadTestEnv } from "./tests/helpers/env";

loadTestEnv();

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
