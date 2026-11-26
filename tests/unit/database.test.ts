import mongoose from 'mongoose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const DATABASE_URL = 'mongodb://db.wrkload.test/wrkload'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('DATABASE', DATABASE_URL)
})

describe('database', () => {
  it('connects to the DATABASE url on startup', async () => {
    const connect = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await import('../../src/config/database.ts')

    expect(connect).toHaveBeenCalledWith(DATABASE_URL)
  })

  it.fails('stops the startup when the connection fails', async () => {
    const error = new Error('bad auth : Authentication failed.')
    vi.spyOn(mongoose, 'connect').mockRejectedValue(error)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(import('../../src/config/database.ts')).rejects.toThrow(error)
  })
})
