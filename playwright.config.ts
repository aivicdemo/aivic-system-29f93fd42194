import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 4,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://dev.d1emy3h78v3h4u.amplifyapp.com" },
  reporter: "list",
});
