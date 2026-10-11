import { defineConfig, devices } from '@playwright/test';

// En algunos entornos (CI propio, contenedores) Chromium ya está instalado:
// PW_CHROMIUM_PATH=/ruta/a/chrome npx playwright test
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: { executablePath },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'celular',
      use: {
        ...devices['Pixel 5'],
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
