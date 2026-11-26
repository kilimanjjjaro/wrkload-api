import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import app from '../../src/app.ts'
import { User } from '../../src/models/User.ts'
import { sendMail } from '../utils/mail.ts'
import { createUser } from '../utils/users.ts'
import {
  API,
  DEFAULT_PASSWORD,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
  HTTP_STATUS_UNAUTHORIZED,
  SINGLE_CALL
} from '../constants/api.ts'

const spyConsoleError = () =>
  vi.spyOn(console, 'error').mockImplementation(() => undefined)

describe('error logs', () => {
  it.fails('does not log the errors caused by the client', async () => {
    const consoleError = spyConsoleError()

    const login = await request(app)
      .post(`${API.auth}/login`)
      .send({ email: 'nobody@wrkload.test', password: DEFAULT_PASSWORD })
    const tasks = await request(app).get(API.tasks)

    expect(login.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(tasks.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it.fails('logs an unexpected error once', async () => {
    const error = new Error('Database exploded')
    vi.spyOn(User, 'findOne').mockRejectedValueOnce(error)
    const consoleError = spyConsoleError()

    const response = await request(app)
      .post(`${API.auth}/login`)
      .send({ email: 'kili@wrkload.test', password: DEFAULT_PASSWORD })

    expect(response.status).toBe(HTTP_STATUS_INTERNAL_SERVER_ERROR)
    expect(consoleError).toHaveBeenCalledTimes(SINGLE_CALL)
    expect(consoleError).toHaveBeenCalledWith(error)
  })

  it('logs a mail delivery failure once', async () => {
    const user = await createUser()
    const error = new Error('Mail delivery failed')
    sendMail.mockRejectedValueOnce(error)
    const consoleError = spyConsoleError()

    const response = await request(app)
      .post(`${API.auth}/remember-password`)
      .send({ email: user.email })

    expect(response.status).toBe(HTTP_STATUS_SERVICE_UNAVAILABLE)
    expect(consoleError).toHaveBeenCalledTimes(SINGLE_CALL)
    expect(consoleError).toHaveBeenCalledWith(error)
  })
})
