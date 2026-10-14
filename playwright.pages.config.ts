import { defineConfig } from "@playwright/test";
import common from "./playwright.config";
export default defineConfig({
  ...common,
  testDir: "./tests/pages",
  outputDir: "test-results/pages",
  use: { ...common.use, baseURL: "http://127.0.0.1:5174" },
  webServer: {
    command: "node scripts/serve-pages.mjs",
    url: "http://127.0.0.1:5174/pdf-command-center/",
    reuseExistingServer: false,
    timeout: 15000,
  },
});
