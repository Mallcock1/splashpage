import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  timeout: 120000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 2560, height: 1440 },
    deviceScaleFactor: 6
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120000
  }
});
