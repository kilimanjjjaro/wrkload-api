import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, inject, vi } from 'vitest'
import { rateLimitStores } from '../../src/middlewares/rateLimit.middleware.ts'

vi.mock('../../src/utils/transporter.ts', async () => {
  const { sendMail } = await import('../utils/mail.ts')
  return { default: { sendMail } }
})

beforeAll(async () => {
  await mongoose.connect(inject('mongoUri'), { dbName: `test-${randomUUID()}` })
  await mongoose.connection.syncIndexes()
})

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections)
  await Promise.all([
    ...collections.map(async (collection) => await collection.deleteMany({})),
    ...rateLimitStores.map(async (store) => {
      await store.resetAll()
    })
  ])
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})
