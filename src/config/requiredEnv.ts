import { EMPTY_LENGTH } from '../constants/index.ts'
import { env } from '../utils/env.ts'

const REQUIRED_ENV = [
  'DATABASE',
  'ACCESS_KEY',
  'REFRESH_KEY',
  'CONFIRMATION_ACCOUNT_KEY',
  'RESET_PASSWORD_KEY',
  'RESEND_API_KEY',
  'FRONTEND_URL'
]

const missingEnv = REQUIRED_ENV.filter((name) => env(name) === '')

if (missingEnv.length > EMPTY_LENGTH)
  throw new Error(`Missing environment variables: ${missingEnv.join(', ')}`)
