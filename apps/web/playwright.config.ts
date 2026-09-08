import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const baseURL = `http://127.0.0.1:${String(PORT)}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : [['list']],
  use: {
    baseURL,
    // The app picks its language from the browser, so tests fix one; language
    // switching itself is covered by language.spec.ts.
    locale: 'en-US',
    // Reports and traces exist for failures; nothing is auto-accepted.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // Tests run against the production build, like CI does.
  webServer: [
    {
      command: 'pnpm --filter @allet/server exec tsx tests/e2e-server.ts',
      url: 'http://127.0.0.1:3002/api/health',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // Bind explicitly: vite preview otherwise listens on ::1 only.
      command: `pnpm exec vite preview --host 127.0.0.1 --port ${String(PORT)} --strictPort`,
      env: { ALLET_API_TARGET: 'http://127.0.0.1:3002' },
      url: baseURL,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
