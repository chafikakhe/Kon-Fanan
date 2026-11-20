import { defineConfig } from "@playwright/test";

const port = Number(process.env.KF_AUTH_TEST_PORT || 5283);
export default defineConfig({
  testDir: "tests/auth-browser",
  workers: 1,
  timeout: 60000,
  use: { baseURL: `http://127.0.0.1:${port}`, headless: true, trace: "off" },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    env: {
      VITE_SUPABASE_URL: "https://auth.kon-fanan.test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "public-fixture",
    },
    reuseExistingServer: false,
  },
  reporter: "list",
});
