import mongoose from 'mongoose'
import { env } from '../utils/env.ts'
import { logInfo } from '../utils/logger.ts'

await mongoose.connect(env('DATABASE'))
logInfo('Database connected')
