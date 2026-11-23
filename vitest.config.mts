import { defineConfig } from 'vitest/config'

const MONGO_HOOK_TIMEOUT_MS = 60_000

export default defineConfig({
  test: {
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    silent: 'passed-only',
    env: {
      ACCESS_KEY: 'test-access-key',
      REFRESH_KEY: 'test-refresh-key',
      CONFIRMATION_ACCOUNT_KEY: 'test-confirmation-key',
      RESET_PASSWORD_KEY: 'test-reset-password-key',
      FRONTEND_URL: 'https://wrkload.test'
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'api',
          include: ['tests/api/**/*.test.ts'],
          globalSetup: ['tests/api/global-setup.ts'],
          setupFiles: ['tests/api/setup.ts'],
          hookTimeout: MONGO_HOOK_TIMEOUT_MS
        }
      }
    ]
  }
})
