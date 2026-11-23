import type { Types } from 'mongoose'

declare global {
  namespace Express {
    interface Request {
      uid?: Types.ObjectId | string
      role?: number
      email?: string
    }
  }
}

export {}
