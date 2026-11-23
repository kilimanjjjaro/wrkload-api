import type { Response } from 'express'
import jwt from 'jsonwebtoken'
import type { Types } from 'mongoose'
import { env } from './env.ts'

type Uid = Types.ObjectId | string

export const tokenGenerator = (
  uid: Uid | undefined,
  role: number | undefined,
  email: string | undefined
) => {
  const expiresIn = 60 * 15

  const accessToken = jwt.sign({ uid, role, email }, env('ACCESS_KEY'), {
    expiresIn
  })

  return { accessToken, expiresIn }
}

export const refreshTokenGenerator = (
  uid: Uid,
  role: number,
  email: string,
  res: Pick<Response, 'cookie'>
) => {
  const expiresIn = 60 * 60 * 24 * 30

  try {
    const refreshToken = jwt.sign({ uid, role, email }, env('REFRESH_KEY'), {
      expiresIn
    })

    res.cookie('refreshToken', refreshToken, {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + expiresIn * 1000)
    })

    return { refreshToken, expiresIn }
  } catch (error) {
    console.error(error)
  }
}

export const confirmationTokenGenerator = (email: string) => {
  const expiresIn = 60 * 60 * 24

  try {
    const confirmationToken = jwt.sign(
      { email },
      env('CONFIRMATION_ACCOUNT_KEY'),
      {
        expiresIn
      }
    )
    return confirmationToken
  } catch (error) {
    console.error(error)
  }
}

export const resetPassTokenGenerator = (uid: Uid, password: string) => {
  const expiresIn = 60 * 60 * 24
  const token = env('RESET_PASSWORD_KEY') + password

  const resetPasswordToken = jwt.sign({ uid }, token, {
    expiresIn
  })

  return { resetPasswordToken, expiresIn }
}
