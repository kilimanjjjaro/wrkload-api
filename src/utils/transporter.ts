import 'dotenv/config'
import { Resend } from 'resend'
import { env } from './env.ts'

interface Mail {
  from: string
  to: string
  subject: string
  html: string
}

let resend: Resend | null = null

const client = () => {
  resend ??= new Resend(env('RESEND_API_KEY'))
  return resend
}

const transporter = {
  sendMail: async (mail: Mail) => {
    const { data, error } = await client().emails.send(mail)

    if (error !== null)
      throw new Error('Mail delivery failed', { cause: error })

    return data
  }
}

export default transporter
