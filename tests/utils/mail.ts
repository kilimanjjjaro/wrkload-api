import { vi } from 'vitest'

interface SentMail {
  from: string
  to: string
  subject: string
  html: string
}

export const sendMail = vi
  .fn<(mail: SentMail) => Promise<object>>()
  .mockResolvedValue({})

export const lastSentMail = () => {
  const {
    mock: { lastCall }
  } = sendMail

  if (lastCall === undefined) throw new Error('No mail was sent')

  const [mail] = lastCall
  return mail
}

export const findLink = (html: string, path: string) => {
  const match = new RegExp(`href="([^"]*/${path}/[^"]+)"`, 'v').exec(html)

  if (match === null) throw new Error(`No ${path} link in the mail`)

  const [, link] = match
  return new URL(link)
}
