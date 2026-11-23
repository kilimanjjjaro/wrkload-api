import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, inject, vi } from 'vitest'

vi.mock('../../src/utils/transporter.ts', () => ({
  default: { sendMail: vi.fn().mockResolvedValue({}) }
}))

beforeAll(async () => {
  await mongoose.connect(inject('mongoUri'), { dbName: `test-${randomUUID()}` })
  await mongoose.connection.syncIndexes()
})

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections)
  await Promise.all(collections.map((collection) => collection.deleteMany({})))
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})
