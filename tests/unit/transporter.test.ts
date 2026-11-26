import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
  SINGLE_CALL
} from '../constants/api.ts'

const { Resend, send } = vi.hoisted(() => {
  const send = vi.fn()
  const Resend = vi.fn(
    class {
      emails = { send }
    }
  )
  return { Resend, send }
})

vi.mock('resend', () => ({ Resend }))

const { default: transporter } = await import('../../src/utils/transporter.ts')

const MAIL = {
  from: '"wrkload" <wrkload@kilimanjjjaro.com>',
  to: 'kili@wrkload.test',
  subject: 'Confirm your account',
  html: '<a href="https://wrkload.test/confirm-account/token">Confirm</a>'
}

describe('transporter', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
  })

  it('loads without creating the resend client', () => {
    expect(Resend).not.toHaveBeenCalled()
  })

  it('sends the html mails the controllers build through resend', async () => {
    send.mockResolvedValueOnce({
      data: { id: 'mail-id' },
      error: null,
      headers: null
    })

    await expect(transporter.sendMail(MAIL)).resolves.toEqual({
      id: 'mail-id'
    })
    expect(Resend).toHaveBeenCalledWith('re_test_key')
    expect(send).toHaveBeenCalledTimes(SINGLE_CALL)
    expect(send).toHaveBeenCalledWith(MAIL)
  })

  it('reuses the same resend client for every mail', async () => {
    send.mockResolvedValue({
      data: { id: 'mail-id' },
      error: null,
      headers: null
    })
    vi.resetModules()
    const { default: freshTransporter } =
      await import('../../src/utils/transporter.ts')

    await freshTransporter.sendMail(MAIL)
    await freshTransporter.sendMail(MAIL)

    expect(Resend).toHaveBeenCalledTimes(SINGLE_CALL)
  })

  it('fails when resend rejects the mail', async () => {
    const error = {
      name: 'invalid_from_address',
      message: 'Invalid `from` field',
      statusCode: HTTP_STATUS_UNPROCESSABLE_CONTENT
    }
    send.mockResolvedValueOnce({ data: null, error, headers: null })

    await expect(transporter.sendMail(MAIL)).rejects.toThrow(
      expect.objectContaining({ message: 'Mail delivery failed', cause: error })
    )
  })
})
