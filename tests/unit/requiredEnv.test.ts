import { beforeEach, describe, expect, it, vi } from 'vitest'

const REQUIRED_ENV = {
  DATABASE: 'mongodb://db.wrkload.test/wrkload',
  ACCESS_KEY: 'access-key',
  REFRESH_KEY: 'refresh-key',
  CONFIRMATION_ACCOUNT_KEY: 'confirmation-key',
  RESET_PASSWORD_KEY: 'reset-password-key',
  RESEND_API_KEY: 're_test_key',
  FRONTEND_URL: 'https://wrkload.test'
}

beforeEach(() => {
  vi.resetModules()

  for (const [name, value] of Object.entries(REQUIRED_ENV)) {
    vi.stubEnv(name, value)
  }
})

describe('required environment variables', () => {
  it('lets the api start when every variable is set', async () => {
    await expect(
      import('../../src/config/requiredEnv.ts')
    ).resolves.toBeDefined()
  })

  it('stops the startup listing the missing or empty variables', async () => {
    vi.stubEnv('RESEND_API_KEY', undefined)
    vi.stubEnv('FRONTEND_URL', '')

    await expect(import('../../src/config/requiredEnv.ts')).rejects.toThrow(
      'Missing environment variables: RESEND_API_KEY, FRONTEND_URL'
    )
  })
})
