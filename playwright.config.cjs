const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.cjs',
  timeout: 60000,
  expect: { timeout: 20000 },
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'https://usarockhounding.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15000
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }
  ]
});
