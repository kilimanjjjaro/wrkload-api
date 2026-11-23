import jwt from 'jsonwebtoken'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../../app.js'
import { User } from '../../models/User.js'
import {
  ACCESS_TOKEN_EXPIRES_IN,
  API,
  DEFAULT_PASSWORD,
  ROLES,
  TRIAL_ACCOUNT_ID
} from '../constants/api.ts'
import { findLink, lastSentMail, sendMail } from '../utils/mail.ts'
import { bearer, createUser } from '../utils/users.ts'

const NEW_PASSWORD = 'another-secret-password'

const registerBody = {
  username: 'Kili',
  email: 'Kili@Wrkload.test',
  avatar: 'https://wrkload.test/avatar.png',
  password: DEFAULT_PASSWORD
}

const login = (email: string, password = DEFAULT_PASSWORD) =>
  request(app).post(`${API.auth}/login`).send({ email, password })

const refreshTokenCookie = (setCookie: string[] | string | undefined) => {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? '']
  const cookie = cookies.find((value) => value.startsWith('refreshToken='))

  if (cookie === undefined) throw new Error('No refreshToken cookie was set')

  return cookie
}

describe('POST /auth/register', () => {
  it('creates an unconfirmed partner and mails the confirmation link', async () => {
    const response = await request(app)
      .post(`${API.auth}/register`)
      .send(registerBody)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ status: 'ok' })

    const user = await User.findOne({ email: 'kili@wrkload.test' })
    expect(user).not.toBeNull()
    expect(user?.role).toBe(ROLES.partner)
    expect(user?.confirmationStatus).toBe(false)
    expect(user?.password).not.toBe(DEFAULT_PASSWORD)
    expect(await user?.comparePassword(DEFAULT_PASSWORD)).toBe(true)

    const mail = lastSentMail()
    expect(mail.to).toBe('kili@wrkload.test')
    expect(mail.subject).toBe('Confirm your account')

    const link = findLink(mail.html, 'confirm-account')
    expect(link.origin).toBe(process.env.FRONTEND_URL)
    expect(link.pathname).toBe(`/confirm-account/${user?.confirmationToken}`)
  })

  it('rejects an email that is already registered', async () => {
    await createUser({ email: 'kili@wrkload.test' })

    const response = await request(app)
      .post(`${API.auth}/register`)
      .send(registerBody)

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('auth/email-already-exists')
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('validates the fields', async () => {
    const response = await request(app)
      .post(`${API.auth}/register`)
      .send({ username: '', email: 'not-an-email', avatar: '', password: '1' })

    expect(response.status).toBe(400)
    expect(
      response.body.error.map((error: { path: string }) => error.path)
    ).toEqual(['username', 'email', 'avatar', 'password'])
    expect(await User.countDocuments()).toBe(0)
  })
})

describe('POST /auth/login', () => {
  it('returns the user, an access token and sets the refresh token cookie', async () => {
    const user = await createUser({ email: 'kili@wrkload.test' })

    const response = await login('KILI@wrkload.test')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      user: {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role
      },
      accessToken: expect.any(String),
      expiresIn: ACCESS_TOKEN_EXPIRES_IN
    })

    const payload = jwt.verify(
      response.body.accessToken,
      process.env.ACCESS_KEY ?? ''
    )
    expect(payload).toMatchObject({
      uid: user._id.toString(),
      role: user.role,
      email: user.email
    })

    const cookie = refreshTokenCookie(response.headers['set-cookie'])
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Expires=')

    const updated = await User.findById(user._id)
    expect(updated?.lastActiveAt).not.toBe('')
  })

  it('rejects an unknown email', async () => {
    const response = await login('nobody@wrkload.test')

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      status: 'error',
      code: 'auth/user-not-found',
      message: 'Wrong email or password'
    })
  })

  it('rejects an unconfirmed account', async () => {
    const user = await createUser({ confirmed: false })

    const response = await login(user.email)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('auth/account-not-confirmed')
  })

  it('rejects a wrong password', async () => {
    const user = await createUser()

    const response = await login(user.email, 'wrong-password')

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('auth/invalid-credentials')
  })

  it('validates the fields', async () => {
    const response = await login('not-an-email', 'short')

    expect(response.status).toBe(400)
    expect(
      response.body.error.map((error: { path: string }) => error.path)
    ).toEqual(['email', 'password'])
  })
})

describe('GET /auth/refreshToken', () => {
  it('returns a new access token from the refresh token cookie', async () => {
    const user = await createUser()
    const loginResponse = await login(user.email)
    const cookie = refreshTokenCookie(loginResponse.headers['set-cookie'])

    const response = await request(app)
      .get(`${API.auth}/refreshToken`)
      .set('Cookie', cookie.split(';')[0])

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      status: 'ok',
      accessToken: expect.any(String),
      expiresIn: ACCESS_TOKEN_EXPIRES_IN
    })
    expect(
      jwt.verify(response.body.accessToken, process.env.ACCESS_KEY ?? '')
    ).toMatchObject({ uid: user._id.toString(), email: user.email })
  })

  it('rejects a request without the cookie', async () => {
    const response = await request(app).get(`${API.auth}/refreshToken`)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('token/token-not-found')
  })

  it('rejects a refresh token signed with another key', async () => {
    const token = jwt.sign({ uid: 'x' }, 'another-key')

    const response = await request(app)
      .get(`${API.auth}/refreshToken`)
      .set('Cookie', `refreshToken=${token}`)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('token/invalid-signature')
  })
})

describe('GET /auth/logout', () => {
  it('clears the refresh token cookie', async () => {
    const response = await request(app).get(`${API.auth}/logout`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
    expect(refreshTokenCookie(response.headers['set-cookie'])).toContain(
      'Expires=Thu, 01 Jan 1970'
    )
  })
})

describe('PATCH /auth/confirm-account/:confirmationToken', () => {
  it('confirms the account from the mailed link', async () => {
    await request(app).post(`${API.auth}/register`).send(registerBody)
    const link = findLink(lastSentMail().html, 'confirm-account')

    const response = await request(app).patch(`${API.auth}${link.pathname}`)

    expect(response.status).toBe(201)

    const user = await User.findOne({ email: 'kili@wrkload.test' })
    expect(user?.confirmationStatus).toBe(true)
    expect(user?.confirmationToken).toBe('')
    expect((await login('kili@wrkload.test')).status).toBe(200)
  })

  it('rejects a link that was already used', async () => {
    await request(app).post(`${API.auth}/register`).send(registerBody)
    const link = findLink(lastSentMail().html, 'confirm-account')
    await request(app).patch(`${API.auth}${link.pathname}`)

    const response = await request(app).patch(`${API.auth}${link.pathname}`)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('auth/account-already-confirmed')
  })
})

describe('POST /auth/resend-confirm-account', () => {
  it('mails a new confirmation link', async () => {
    const user = await createUser({ confirmed: false })

    const response = await request(app)
      .post(`${API.auth}/resend-confirm-account`)
      .send({ email: user.email })

    expect(response.status).toBe(201)

    const updated = await User.findById(user._id)
    const mail = lastSentMail()
    expect(mail.to).toBe(user.email)
    expect(findLink(mail.html, 'confirm-account').pathname).toBe(
      `/confirm-account/${updated?.confirmationToken}`
    )
  })

  it('rejects a confirmed account', async () => {
    const user = await createUser()

    const response = await request(app)
      .post(`${API.auth}/resend-confirm-account`)
      .send({ email: user.email })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('auth/account-already-confirmed')
  })

  it('rejects an unknown email', async () => {
    const response = await request(app)
      .post(`${API.auth}/resend-confirm-account`)
      .send({ email: 'nobody@wrkload.test' })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('auth/user-not-found')
  })
})

describe('PATCH /auth/change-password', () => {
  const changePassword = (
    user: { _id: unknown; role: number; email: string },
    body: object
  ) =>
    request(app)
      .patch(`${API.auth}/change-password`)
      .set('Authorization', bearer(user))
      .send({ email: user.email, ...body })

  it('changes the password', async () => {
    const user = await createUser()

    const response = await changePassword(user, {
      oldPassword: DEFAULT_PASSWORD,
      newPassword: NEW_PASSWORD
    })

    expect(response.status).toBe(201)
    expect((await login(user.email, NEW_PASSWORD)).status).toBe(200)
    expect((await login(user.email)).status).toBe(403)
  })

  it('requires an access token', async () => {
    const response = await request(app)
      .patch(`${API.auth}/change-password`)
      .send({
        email: 'kili@wrkload.test',
        oldPassword: DEFAULT_PASSWORD,
        newPassword: NEW_PASSWORD
      })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('token/token-not-found')
  })

  it('rejects a wrong old password', async () => {
    const user = await createUser()

    const response = await changePassword(user, {
      oldPassword: 'wrong-password',
      newPassword: NEW_PASSWORD
    })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('auth/invalid-credentials')
  })

  it('rejects the same password', async () => {
    const user = await createUser()

    const response = await changePassword(user, {
      oldPassword: DEFAULT_PASSWORD,
      newPassword: DEFAULT_PASSWORD
    })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('auth/invalid-credentials')
  })

  it('rejects the trial account', async () => {
    const user = await createUser({ _id: TRIAL_ACCOUNT_ID, role: ROLES.trial })

    const response = await changePassword(user, {
      oldPassword: DEFAULT_PASSWORD,
      newPassword: NEW_PASSWORD
    })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('trial/permission-denied')
  })
})

describe('password reset', () => {
  const rememberPassword = (email: string) =>
    request(app).post(`${API.auth}/remember-password`).send({ email })

  it('mails a reset link that sets a new password once', async () => {
    const user = await createUser()

    const rememberResponse = await rememberPassword(user.email)

    expect(rememberResponse.status).toBe(200)

    const mail = lastSentMail()
    expect(mail.to).toBe(user.email)
    expect(mail.subject).toBe('Reset your password')

    const link = findLink(mail.html, 'reset-password')
    expect(link.pathname).toMatch(
      new RegExp(`^/reset-password/${user._id.toString()}/[^/]+$`)
    )

    const resetResponse = await request(app)
      .patch(`${API.auth}${link.pathname}`)
      .send({ newPassword: NEW_PASSWORD })

    expect(resetResponse.status).toBe(201)
    expect((await login(user.email, NEW_PASSWORD)).status).toBe(200)

    const reusedResponse = await request(app)
      .patch(`${API.auth}${link.pathname}`)
      .send({ newPassword: 'yet-another-password' })

    expect(reusedResponse.status).toBe(401)
    expect(reusedResponse.body.code).toBe('token/invalid-signature')
  })

  it('rejects an unknown email', async () => {
    const response = await rememberPassword('nobody@wrkload.test')

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('auth/user-not-found')
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('rejects the trial account', async () => {
    const user = await createUser({ _id: TRIAL_ACCOUNT_ID, role: ROLES.trial })

    const response = await rememberPassword(user.email)

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('trial/permission-denied')
  })

  it('requires a new password with at least 8 characters', async () => {
    const user = await createUser()

    const response = await request(app)
      .patch(`${API.auth}/reset-password/${user._id.toString()}/token`)
      .send({ newPassword: 'short' })

    expect(response.status).toBe(400)
    expect(response.body.error[0].path).toBe('newPassword')
  })
})
