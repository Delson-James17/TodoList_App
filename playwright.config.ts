import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }], ['./tests/reporters/excel-reporter.ts']],
  use: {
    baseURL: process.env.CI ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: { mode: 'on', fullPage: true },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: process.env.CI
      ? 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort'
      : 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: process.env.CI ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
})



