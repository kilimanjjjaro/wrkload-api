import 'dotenv/config'
import nodemailer from 'nodemailer'
import { SMTP_SSL_PORT } from '../constants/index.ts'
import { logInfo } from './logger.ts'

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: SMTP_SSL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

void transporter.verify().then(() => {
  logInfo('Ready for send mails')
})

export default transporter
