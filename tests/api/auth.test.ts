import jwt from 'jsonwebtoken'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../../src/app.ts'
import { User } from '../../src/models/User.ts'
import { findLink, lastSentMail, sendMail } from '../utils/mail.ts'
import { bearer, createUser } from '../utils/users.ts'
import {
  ACCESS_TOKEN_EXPIRES_IN,
  API,
  DEFAULT_PASSWORD,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
  LEGACY_PASSWORD_HASH,
  NO_DOCUMENTS,
  ROLE_PARTNER,
  ROLE_TRIAL,
  TRIAL_ACCOUNT_ID
} from '../constants/api.ts'
import { ACCESS_TOKEN_SCHEMA } from '../constants/schemas.ts'
import {
  body,
  parseBody,
  validationErrorMessages,
  validationErrorPaths
} from '../utils/http.ts'

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

    expect(response.status).toBe(HTTP_STATUS_CREATED)
    expect(response.body).toEqual({ status: 'ok' })

    const user = await User.findOne({ email: 'kili@wrkload.test' })
    expect(user).not.toBeNull()
    expect(user?.role).toBe(ROLE_PARTNER)
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

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(body(response)).toMatchObject({ code: 'auth/email-already-exists' })
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('validates the fields', async () => {
    const response = await request(app)
      .post(`${API.auth}/register`)
      .send({ username: '', email: 'not-an-email', avatar: '', password: '1' })

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST)
    expect(validationErrorPaths(response)).toEqual([
      'username',
      'email',
      'avatar',
      'password'
    ])
    expect(validationErrorMessages(response)).toEqual([
      'Username are required',
      'Incorrect email format',
      'Avatar are required',
      'Password must have a minimum of 8 characters'
    ])
    expect(await User.countDocuments()).toBe(NO_DOCUMENTS)
  })
})

describe('POST /auth/login', () => {
  it('returns the user, an access token and sets the refresh token cookie', async () => {
    const user = await createUser({ email: 'kili@wrkload.test' })

    const response = await login('KILI@wrkload.test')

    expect(response.status).toBe(HTTP_STATUS_OK)
    const { accessToken } = parseBody(ACCESS_TOKEN_SCHEMA, response)
    expect(response.body).toEqual({
      status: 'ok',
      user: {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role
      },
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN
    })

    const payload = jwt.verify(accessToken, process.env.ACCESS_KEY ?? '')
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

  it('accepts a password hashed by a previous bcryptjs version', async () => {
    const user = await createUser()
    await User.collection.updateOne(
      { _id: user._id },
      { $set: { password: LEGACY_PASSWORD_HASH } }
    )

    expect((await login(user.email)).status).toBe(HTTP_STATUS_OK)
    expect((await login(user.email, 'wrong-password')).status).toBe(
      HTTP_STATUS_FORBIDDEN
    )
  })

  it('rejects an unknown email', async () => {
    const response = await login('nobody@wrkload.test')

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(response.body).toEqual({
      status: 'error',
      code: 'auth/user-not-found',
      message: 'Wrong email or password'
    })
  })

  it('rejects an unconfirmed account', async () => {
    const user = await createUser({ confirmed: false })

    const response = await login(user.email)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'auth/account-not-confirmed' })
  })

  it('rejects a wrong password', async () => {
    const user = await createUser()

    const response = await login(user.email, 'wrong-password')

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(body(response)).toMatchObject({ code: 'auth/invalid-credentials' })
  })

  it('validates the fields', async () => {
    const response = await login('not-an-email', 'short')

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST)
    expect(validationErrorPaths(response)).toEqual(['email', 'password'])
  })
})

describe('GET /auth/refreshToken', () => {
  it('returns a new access token from the refresh token cookie', async () => {
    const user = await createUser()
    const loginResponse = await login(user.email)
    const cookie = refreshTokenCookie(loginResponse.headers['set-cookie'])
    const [cookiePair] = cookie.split(';')

    const response = await request(app)
      .get(`${API.auth}/refreshToken`)
      .set('Cookie', cookiePair)

    expect(response.status).toBe(HTTP_STATUS_CREATED)
    const { accessToken } = parseBody(ACCESS_TOKEN_SCHEMA, response)
    expect(response.body).toEqual({
      status: 'ok',
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN
    })
    expect(jwt.verify(accessToken, process.env.ACCESS_KEY ?? '')).toMatchObject(
      { uid: user._id.toString(), email: user.email }
    )
  })

  it('rejects a request without the cookie', async () => {
    const response = await request(app).get(`${API.auth}/refreshToken`)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'token/token-not-found' })
  })

  it('rejects a refresh token signed with another key', async () => {
    const token = jwt.sign({ uid: 'x' }, 'another-key')

    const response = await request(app)
      .get(`${API.auth}/refreshToken`)
      .set('Cookie', `refreshToken=${token}`)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'token/invalid-signature' })
  })
})

describe('GET /auth/logout', () => {
  it('clears the refresh token cookie', async () => {
    const response = await request(app).get(`${API.auth}/logout`)

    expect(response.status).toBe(HTTP_STATUS_OK)
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

    expect(response.status).toBe(HTTP_STATUS_CREATED)

    const user = await User.findOne({ email: 'kili@wrkload.test' })
    expect(user?.confirmationStatus).toBe(true)
    expect(user?.confirmationToken).toBe('')
    expect((await login('kili@wrkload.test')).status).toBe(HTTP_STATUS_OK)
  })

  it('rejects a link that was already used', async () => {
    await request(app).post(`${API.auth}/register`).send(registerBody)
    const link = findLink(lastSentMail().html, 'confirm-account')
    await request(app).patch(`${API.auth}${link.pathname}`)

    const response = await request(app).patch(`${API.auth}${link.pathname}`)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({
      code: 'auth/account-already-confirmed'
    })
  })
})

describe('POST /auth/resend-confirm-account', () => {
  it('mails a new confirmation link', async () => {
    const user = await createUser({ confirmed: false })

    const response = await request(app)
      .post(`${API.auth}/resend-confirm-account`)
      .send({ email: user.email })

    expect(response.status).toBe(HTTP_STATUS_CREATED)

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

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({
      code: 'auth/account-already-confirmed'
    })
  })

  it('rejects an unknown email', async () => {
    const response = await request(app)
      .post(`${API.auth}/resend-confirm-account`)
      .send({ email: 'nobody@wrkload.test' })

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(body(response)).toMatchObject({ code: 'auth/user-not-found' })
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

    expect(response.status).toBe(HTTP_STATUS_CREATED)
    expect((await login(user.email, NEW_PASSWORD)).status).toBe(HTTP_STATUS_OK)
    expect((await login(user.email)).status).toBe(HTTP_STATUS_FORBIDDEN)
  })

  it('requires an access token', async () => {
    const response = await request(app)
      .patch(`${API.auth}/change-password`)
      .send({
        email: 'kili@wrkload.test',
        oldPassword: DEFAULT_PASSWORD,
        newPassword: NEW_PASSWORD
      })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'token/token-not-found' })
  })

  it('rejects a wrong old password', async () => {
    const user = await createUser()

    const response = await changePassword(user, {
      oldPassword: 'wrong-password',
      newPassword: NEW_PASSWORD
    })

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(body(response)).toMatchObject({ code: 'auth/invalid-credentials' })
  })

  it('changes the password of the logged in user only', async () => {
    const user = await createUser()
    const other = await createUser()

    const response = await request(app)
      .patch(`${API.auth}/change-password`)
      .set('Authorization', bearer(user))
      .send({
        email: other.email,
        oldPassword: DEFAULT_PASSWORD,
        newPassword: NEW_PASSWORD
      })

    expect(response.status).toBe(HTTP_STATUS_CREATED)
    expect((await login(user.email, NEW_PASSWORD)).status).toBe(HTTP_STATUS_OK)
    expect((await login(other.email)).status).toBe(HTTP_STATUS_OK)
  })

  it('rejects the same password', async () => {
    const user = await createUser()

    const response = await changePassword(user, {
      oldPassword: DEFAULT_PASSWORD,
      newPassword: DEFAULT_PASSWORD
    })

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(body(response)).toMatchObject({ code: 'auth/invalid-credentials' })
  })

  it('rejects the trial account', async () => {
    const user = await createUser({ _id: TRIAL_ACCOUNT_ID, role: ROLE_TRIAL })

    const response = await changePassword(user, {
      oldPassword: DEFAULT_PASSWORD,
      newPassword: NEW_PASSWORD
    })

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'trial/permission-denied' })
  })
})

describe('password reset', () => {
  const rememberPassword = (email: string) =>
    request(app).post(`${API.auth}/remember-password`).send({ email })

  it('mails a reset link that sets a new password once', async () => {
    const user = await createUser()

    const rememberResponse = await rememberPassword(user.email)

    expect(rememberResponse.status).toBe(HTTP_STATUS_OK)

    const mail = lastSentMail()
    expect(mail.to).toBe(user.email)
    expect(mail.subject).toBe('Reset your password')

    const link = findLink(mail.html, 'reset-password')
    expect(link.pathname).toMatch(
      new RegExp(`^/reset-password/${user._id.toString()}/[^\\/]+$`, 'v')
    )

    const resetResponse = await request(app)
      .patch(`${API.auth}${link.pathname}`)
      .send({ newPassword: NEW_PASSWORD })

    expect(resetResponse.status).toBe(HTTP_STATUS_CREATED)
    expect((await login(user.email, NEW_PASSWORD)).status).toBe(HTTP_STATUS_OK)

    const reusedResponse = await request(app)
      .patch(`${API.auth}${link.pathname}`)
      .send({ newPassword: 'yet-another-password' })

    expect(reusedResponse.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(reusedResponse)).toMatchObject({
      code: 'token/invalid-signature'
    })
  })

  it('rejects an unknown email', async () => {
    const response = await rememberPassword('nobody@wrkload.test')

    expect(response.status).toBe(HTTP_STATUS_FORBIDDEN)
    expect(body(response)).toMatchObject({ code: 'auth/user-not-found' })
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('rejects the trial account', async () => {
    const user = await createUser({ _id: TRIAL_ACCOUNT_ID, role: ROLE_TRIAL })

    const response = await rememberPassword(user.email)

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED)
    expect(body(response)).toMatchObject({ code: 'trial/permission-denied' })
  })

  it('requires a new password with at least 8 characters', async () => {
    const user = await createUser()

    const response = await request(app)
      .patch(`${API.auth}/reset-password/${user._id.toString()}/token`)
      .send({ newPassword: 'short' })

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST)
    const [firstPath] = validationErrorPaths(response)
    expect(firstPath).toBe('newPassword')
  })
})
