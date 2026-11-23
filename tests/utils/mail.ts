import { vi } from 'vitest'
import transporter from '../../src/utils/transporter.ts'

interface SentMail {
  from: string
  to: string
  subject: string
  html: string
}

export const sendMail = vi.mocked(transporter.sendMail)

export const lastSentMail = (): SentMail => {
  const call = sendMail.mock.lastCall

  if (call === undefined) throw new Error('No mail was sent')

  return call[0] as SentMail
}

export const findLink = (html: string, path: string) => {
  const match = html.match(new RegExp(`href="([^"]*/${path}/[^"]+)"`))

  if (match === null) throw new Error(`No ${path} link in the mail`)

  return new URL(match[1])
}
