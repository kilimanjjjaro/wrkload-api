import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../utils/env.ts'
import type { TokenPayload } from '../types/tokens.ts'

export const requireAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let accessToken = req.headers?.authorization

    if (!accessToken) throw new Error('Token not found')

    accessToken = accessToken.split(' ')[1]

    const { uid, role, email } = jwt.verify(
      accessToken,
      env('ACCESS_KEY')
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
