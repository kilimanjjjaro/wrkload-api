import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../utils/env.ts'
import type { TokenPayload } from '../types/tokens.ts'

export const requireRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken as string | undefined

    if (!refreshToken) throw new Error('Token not found')

    const { uid, role, email } = jwt.verify(
      refreshToken,
      env('REFRESH_KEY')
    ) as TokenPayload

    req.uid = uid
    req.role = role
    req.email = email

    next()
  } catch (error) {
    console.error(error)
    next(error)
  }
}
