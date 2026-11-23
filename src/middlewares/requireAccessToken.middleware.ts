import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../utils/env.ts'
import { logError } from '../utils/logger.ts'
import { readTokenPayload } from '../utils/tokenPayloads.ts'

export const requireAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      headers: { authorization }
    } = req

    if (authorization === undefined || authorization === '')
      throw new Error('Token not found')

    const [, accessToken] = authorization.split(' ')

    const { uid, role, email } = readTokenPayload(
      jwt.verify(accessToken, env('ACCESS_KEY'))
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
