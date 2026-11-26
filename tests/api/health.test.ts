import mongoose from 'mongoose'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import app from '../../src/app.ts'
import {
  API,
  HTTP_STATUS_OK,
  HTTP_STATUS_SERVICE_UNAVAILABLE
} from '../constants/api.ts'

describe('GET /health', () => {
  it('reports the api and the database as up', async () => {
    const response = await request(app).get(API.health)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(response.body).toEqual({ status: 'ok', database: 'connected' })
  })

  it('reports an error when the database is not connected', async () => {
    const readyState = vi
      .spyOn(mongoose.connection, 'readyState', 'get')
      .mockReturnValue(mongoose.ConnectionStates.disconnected)

    const response = await request(app).get(API.health)
    readyState.mockRestore()

    expect(response.status).toBe(HTTP_STATUS_SERVICE_UNAVAILABLE)
    expect(response.body).toEqual({
      status: 'error',
      database: 'disconnected'
    })
  })
})
