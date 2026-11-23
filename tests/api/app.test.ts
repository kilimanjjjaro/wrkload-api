import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../../app.js'
import { API } from '../constants/api.ts'

describe('GET /dummy', () => {
  it('responds ok', async () => {
    const response = await request(app).get(API.dummy)

    expect(response.status).toBe(200)
    expect(response.text).toBe('ok')
  })
})

describe('cors', () => {
  it('allows the frontend with credentials', async () => {
    const response = await request(app)
      .options(API.dummy)
      .set('Origin', process.env.FRONTEND_URL ?? '')
      .set('Access-Control-Request-Method', 'PATCH')

    expect(response.status).toBe(204)
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

    expect(response.status).toBe(200)
  })

  it('rejects other origins', async () => {
    const response = await request(app)
      .get(API.dummy)
      .set('Origin', 'https://evil.test')

    expect(response.status).toBe(500)
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
    expect(response.body).toEqual({
      status: 'error',
      code: 'server/unhandled-error'
    })
  })
})

describe('json body', () => {
  it('rejects a malformed body', async () => {
    const response = await request(app)
      .post(`${API.auth}/login`)
      .set('Content-Type', 'application/json')
      .send('{"email":')

    expect(response.status).toBe(500)
    expect(response.body.code).toBe('server/unhandled-error')
  })
})
