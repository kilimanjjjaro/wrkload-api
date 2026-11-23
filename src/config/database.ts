import mongoose from 'mongoose'
import { env } from '../utils/env.ts'
import { logError, logInfo } from '../utils/logger.ts'

try {
  await mongoose.connect(env('DATABASE'))
  logInfo('Database connected')
} catch (error) {
  logError(error)
}
