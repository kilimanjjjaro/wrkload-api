import type Nodemailer from 'nodemailer'
import { describe, expect, it, vi } from 'vitest'
import { SINGLE_CALL, SMTP_SSL_PORT } from '../constants/api.ts'
import { STREAMED_MAIL_SCHEMA } from '../constants/schemas.ts'

const { createTransport, verify } = vi.hoisted(() => ({
  createTransport: vi.fn(),
  verify: vi.fn()
}))

vi.mock('nodemailer', async (importOriginal) => {
  const actual = await importOriginal<{ default: typeof Nodemailer }>()

  createTransport.mockImplementation(() => {
    const transport = actual.default.createTransport({
      streamTransport: true,
      buffer: true
    })
    transport.verify = verify.mockResolvedValue(true)
    return transport
  })

  return { default: { ...actual.default, createTransport } }
})

vi.stubEnv('EMAIL_USER', 'wrkload@gmail.test')
vi.stubEnv('EMAIL_PASS', 'app-password')

const { default: transporter } = await import('../../src/utils/transporter.ts')

const transportCalls = [...createTransport.mock.calls]
const verifyCalls = [...verify.mock.calls]

describe('transporter', () => {
  it('sends the mails through gmail and verifies the connection', () => {
    expect(transportCalls).toEqual([
      [
        {
          service: 'Gmail',
          host: 'smtp.gmail.com',
          port: SMTP_SSL_PORT,
          secure: true,
          auth: { user: 'wrkload@gmail.test', pass: 'app-password' }
        }
      ]
    ])
    expect(verifyCalls).toHaveLength(SINGLE_CALL)
  })

  it('builds the html mails the controllers send', async () => {
    const info = await transporter.sendMail({
      from: '"wrkload" <wrkload@kilimanjjjaro.com>',
      to: 'kili@wrkload.test',
      subject: 'Confirm your account',
      html: '<a href="https://wrkload.test/confirm-account/token">Confirm</a>'
    })

    expect(info.envelope).toEqual({
      from: 'wrkload@kilimanjjjaro.com',
      to: ['kili@wrkload.test']
    })

    const message = STREAMED_MAIL_SCHEMA.parse(info).message.toString()
    expect(message).toContain('From: wrkload <wrkload@kilimanjjjaro.com>')
    expect(message).toContain('To: kili@wrkload.test')
    expect(message).toContain('Subject: Confirm your account')
    expect(message).toContain('Content-Type: text/html; charset=utf-8')
    expect(message).toContain('https://wrkload.test/confirm-account/token')
  })
})
