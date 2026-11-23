import mongoose from 'mongoose'
import { env } from '../utils/env.ts'

try {
  await mongoose.connect(env('DATABASE'))
  console.log('Database connected')
} catch (error) {
  console.error(error)
}
