import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../utils/env.ts'
import { logError } from '../utils/logger.ts'
import { readTokenPayload } from '../utils/tokenPayloads.ts'

export const requireRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: Record<string, unknown> = req.cookies
    const { refreshToken } = cookies

    if (typeof refreshToken !== 'string' || refreshToken === '')
      throw new Error('Token not found')

    const { uid, role, email } = readTokenPayload(
      jwt.verify(refreshToken, env('REFRESH_KEY'))
    )

    req.uid = uid
    req.role = role
    req.email = email

    next()
  } catch (error) {
    logError(error)
    next(error)
  }
}
