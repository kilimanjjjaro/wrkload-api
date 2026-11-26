import { MemoryStore, rateLimit, type Options } from 'express-rate-limit'
import {
  LOGIN_RATE_LIMIT,
  LOGIN_RATE_LIMIT_WINDOW_MS,
  MAIL_RATE_LIMIT,
  MAIL_RATE_LIMIT_WINDOW_MS
} from '../constants/index.ts'

const mailStore = new MemoryStore()
const loginStore = new MemoryStore()

export const rateLimitStores = [mailStore, loginStore]

const tooManyRequests: Options['handler'] = (req, res, next) => {
  next(new Error('Too many requests'))
}

export const mailRateLimit = rateLimit({
  windowMs: MAIL_RATE_LIMIT_WINDOW_MS,
  limit: MAIL_RATE_LIMIT,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  store: mailStore,
  handler: tooManyRequests
})

export const loginRateLimit = rateLimit({
  windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
  limit: LOGIN_RATE_LIMIT,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  store: loginStore,
  handler: tooManyRequests
})
