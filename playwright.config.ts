import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:5279",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5279 --strictPort",
    url: "http://127.0.0.1:5279",
    reuseExistingServer: true,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
