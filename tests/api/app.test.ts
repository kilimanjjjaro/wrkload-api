import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../../src/app.ts'
import {
  API,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_OK
} from '../constants/api.ts'

describe('GET /dummy', () => {
  it('responds ok', async () => {
    const response = await request(app).get(API.dummy)

    expect(response.status).toBe(HTTP_STATUS_OK)
    expect(response.text).toBe('ok')
  })
})

describe('cors', () => {
  it('allows the frontend with credentials', async () => {
    const response = await request(app)
      .options(API.dummy)
      .set('Origin', process.env.FRONTEND_URL ?? '')
      .set('Access-Control-Request-Method', 'PATCH')

    expect(response.status).toBe(HTTP_STATUS_NO_CONTENT)
    expect(response.headers['access-control-allow-origin']).toBe(
      process.env.FRONTEND_URL
    )
    expect(response.headers['access-control-allow-credentials']).toBe('true')
    expect(response.headers['access-control-allow-methods']).toBe(
      'GET,PATCH,POST,DELETE'
    )
  })

  it('allows requests without an origin', async () => {
    const response = await request(app).get(API.dummy)

    expect(response.status).toBe(HTTP_STATUS_OK)
  })

  it('rejects other origins', async () => {
    const response = await request(app)
      .get(API.dummy)
      .set('Origin', 'https://evil.test')

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
    expect(response.body).toEqual({
      status: 'error',
      code: 'cors/origin-not-allowed',
      message: 'Origin not allowed'
    })
  })
})

describe('json body', () => {
  it('rejects a malformed body', async () => {
    const response = await request(app)
      .post(`${API.auth}/login`)
      .set('Content-Type', 'application/json')
      .send('{"email":')

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST)
    expect(response.body).toEqual({
      status: 'error',
      code: 'request/invalid-json',
      message: 'Invalid JSON body'
    })
  })
})
