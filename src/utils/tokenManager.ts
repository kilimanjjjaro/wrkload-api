import type { CookieOptions } from 'express'
import jwt from 'jsonwebtoken'
import type { Types } from 'mongoose'
import {
  ACCESS_TOKEN_EXPIRES_IN,
  CONFIRMATION_TOKEN_EXPIRES_IN,
  MS_PER_SECOND,
  REFRESH_TOKEN_EXPIRES_IN,
  RESET_PASSWORD_TOKEN_EXPIRES_IN
} from '../constants/index.ts'
import { env } from './env.ts'
import { logError } from './logger.ts'

type Uid = Types.ObjectId | string

export interface CookieSetter {
  cookie: (name: string, value: string, options: CookieOptions) => unknown
}

export const tokenGenerator = (
  uid: Uid | undefined,
  role: number | undefined,
  email: string | undefined
) => {
  const expiresIn = ACCESS_TOKEN_EXPIRES_IN

  const accessToken = jwt.sign({ uid, role, email }, env('ACCESS_KEY'), {
    expiresIn
  })

  return { accessToken, expiresIn }
}

export const refreshTokenGenerator = (
  uid: Uid,
  role: number,
  email: string,
  res: CookieSetter
) => {
  const expiresIn = REFRESH_TOKEN_EXPIRES_IN
  const isProduction = process.env.NODE_ENV === 'production'

  try {
    const refreshToken = jwt.sign({ uid, role, email }, env('REFRESH_KEY'), {
      expiresIn
    })

    res.cookie('refreshToken', refreshToken, {
      sameSite: 'lax',
      httpOnly: isProduction,
      secure: isProduction,
      expires: new Date(Date.now() + expiresIn * MS_PER_SECOND)
    })

    return { refreshToken, expiresIn }
  } catch (error) {
    logError(error)
  }
}

export const confirmationTokenGenerator = (email: string) => {
  try {
    return jwt.sign({ email }, env('CONFIRMATION_ACCOUNT_KEY'), {
      expiresIn: CONFIRMATION_TOKEN_EXPIRES_IN
    })
  } catch (error) {
    logError(error)
  }
}

export const resetPassTokenGenerator = (uid: Uid, password: string) => {
  const expiresIn = RESET_PASSWORD_TOKEN_EXPIRES_IN
  const token = env('RESET_PASSWORD_KEY') + password

  const resetPasswordToken = jwt.sign({ uid }, token, {
    expiresIn
  })

  return { resetPasswordToken, expiresIn }
}
