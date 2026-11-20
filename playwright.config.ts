import { defineConfig } from "@playwright/test";
const port = Number(process.env.KF_TEST_PORT || 5279);
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    // Browser tests always run against isolated demo data, never a real account.
    env: { VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "" },
    reuseExistingServer: false,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
