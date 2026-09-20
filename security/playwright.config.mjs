import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './browser',
  timeout: 30000,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/csp-results.json' }]],
  outputDir: '../test-results/csp',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Opt in explicitly; never start the development server for production tests.
  webServer:
    process.env.CSP_START_PREVIEW === '1'
      ? {
          command: 'npm run preview -- --host 127.0.0.1',
          cwd: process.cwd(),
          url: 'http://localhost:4173',
          reuseExistingServer: !process.env.CI,
        }
      : undefined,
});
