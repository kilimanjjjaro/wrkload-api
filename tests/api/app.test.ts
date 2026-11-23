import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../../src/app.ts'
import {
  API,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_OK
} from '../constants/api.ts'
import { body } from '../utils/http.ts'

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

    expect(response.status).toBe(HTTP_STATUS_INTERNAL_SERVER_ERROR)
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
    expect(response.body).toEqual({
      status: 'error',
      code: 'server/unhandled-error',
      message: 'Not allowed by CORS'
    })
  })
})

describe('json body', () => {
  it('rejects a malformed body', async () => {
    const response = await request(app)
      .post(`${API.auth}/login`)
      .set('Content-Type', 'application/json')
      .send('{"email":')

    expect(response.status).toBe(HTTP_STATUS_INTERNAL_SERVER_ERROR)
    expect(body(response)).toMatchObject({ code: 'server/unhandled-error' })
  })
})
