import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../../src/app.ts'
import { sendMail } from '../utils/mail.ts'
import { createUser } from '../utils/users.ts'
import { body } from '../utils/http.ts'
import {
  API,
  DEFAULT_PASSWORD,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_OK,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  LOGIN_RATE_LIMIT,
  MAIL_RATE_LIMIT
} from '../constants/api.ts'

const CLIENT_IP = '203.0.113.10'
const OTHER_CLIENT_IP = '203.0.113.20'

const rememberPassword = (ip = CLIENT_IP) =>
  request(app)
    .post(`${API.auth}/remember-password`)
    .set('X-Forwarded-For', ip)
    .send({ email: 'unknown@wrkload.test' })

const register = (ip = CLIENT_IP) =>
  request(app).post(`${API.auth}/register`).set('X-Forwarded-For', ip).send({
    username: 'Kili',
    email: 'kili@wrkload.test',
    avatar: 'https://wrkload.test/avatar.png',
    password: DEFAULT_PASSWORD
  })

const login = (password: string, ip = CLIENT_IP) =>
  request(app)
    .post(`${API.auth}/login`)
    .set('X-Forwarded-For', ip)
    .send({ email: 'kili@wrkload.test', password })

const times = async <T>(count: number, call: () => Promise<T>) =>
  await Promise.all(Array.from({ length: count }, call))

describe('auth rate limits', () => {
  it('limits the mail requests each client can make per hour', async () => {
    const allowed = await times(
      MAIL_RATE_LIMIT,
      async () => await rememberPassword()
    )

    expect(allowed.map(({ status }) => status)).toEqual(
      Array.from({ length: MAIL_RATE_LIMIT }, () => HTTP_STATUS_FORBIDDEN)
    )

    const limited = await rememberPassword()

    expect(limited.status).toBe(HTTP_STATUS_TOO_MANY_REQUESTS)
    expect(body(limited)).toEqual({
      status: 'error',
      code: 'request/too-many-requests',
      message: 'Too many requests, try again later'
    })
    expect(limited.headers['retry-after']).toBeDefined()
  })

  it('shares the mail limit between the routes that send mails', async () => {
    await times(MAIL_RATE_LIMIT, async () => await rememberPassword())

    const response = await register()

    expect(response.status).toBe(HTTP_STATUS_TOO_MANY_REQUESTS)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('counts each client ip separately behind the proxy', async () => {
    await times(MAIL_RATE_LIMIT, async () => await rememberPassword())

    const response = await rememberPassword(OTHER_CLIENT_IP)

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
  })

  it('limits the failed logins of each client', async () => {
    await createUser({ email: 'kili@wrkload.test' })
    await times(LOGIN_RATE_LIMIT, async () => await login('wrong-password'))

    const response = await login(DEFAULT_PASSWORD)

    expect(response.status).toBe(HTTP_STATUS_TOO_MANY_REQUESTS)
  })

  it('does not count the successful logins', async () => {
    await createUser({ email: 'kili@wrkload.test' })
    await times(LOGIN_RATE_LIMIT, async () => await login(DEFAULT_PASSWORD))

    const response = await login(DEFAULT_PASSWORD)

    expect(response.status).toBe(HTTP_STATUS_OK)
  })
})
