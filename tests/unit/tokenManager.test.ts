import jwt from 'jsonwebtoken'
import { describe, expect, it, vi } from 'vitest'
import {
  confirmationTokenGenerator,
  refreshTokenGenerator,
  resetPassTokenGenerator,
  tokenGenerator
} from '../../src/utils/tokenManager.ts'
import type { CookieSetter } from '../../src/utils/tokenManager.ts'
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ONE_DAY_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN,
  ROLE_PARTNER
} from '../constants/api.ts'
import { TOKEN_PAYLOAD_SCHEMA } from '../constants/schemas.ts'

const UID = '6439b01cf35b6e22570cd000'
const EMAIL = 'kili@wrkload.test'

const lifetime = (token: string) => {
  const { exp, iat } = TOKEN_PAYLOAD_SCHEMA.parse(jwt.decode(token))
  return exp - iat
}

const defined = <T>(value: T | undefined) => {
  if (value === undefined) throw new Error('The token was not signed')
  return value
}

const cookieSetter = () => ({ cookie: vi.fn<CookieSetter['cookie']>() })

const lastCookie = ({ cookie }: ReturnType<typeof cookieSetter>) =>
  defined(cookie.mock.lastCall)

describe('tokenGenerator', () => {
  it('signs a 15 minutes access token', () => {
    const { accessToken, expiresIn } = tokenGenerator(UID, ROLE_PARTNER, EMAIL)

    expect(expiresIn).toBe(ACCESS_TOKEN_EXPIRES_IN)
    expect(jwt.verify(accessToken, process.env.ACCESS_KEY ?? '')).toMatchObject(
      { uid: UID, role: ROLE_PARTNER, email: EMAIL }
    )
    expect(lifetime(accessToken)).toBe(expiresIn)
  })
})

describe('refreshTokenGenerator', () => {
  it('signs a 30 days refresh token and sets it as a cookie', () => {
    const res = cookieSetter()

    const { refreshToken, expiresIn } = defined(
      refreshTokenGenerator(UID, ROLE_PARTNER, EMAIL, res)
    )

    expect(expiresIn).toBe(REFRESH_TOKEN_EXPIRES_IN)
    expect(
      jwt.verify(refreshToken, process.env.REFRESH_KEY ?? '')
    ).toMatchObject({ uid: UID, role: ROLE_PARTNER, email: EMAIL })

    const [name, value, options] = lastCookie(res)
    expect(name).toBe('refreshToken')
    expect(value).toBe(refreshToken)
    expect(options).toEqual({
      sameSite: 'lax',
      httpOnly: false,
      secure: false,
      expires: options.expires
    })
    expect(options.expires).toBeInstanceOf(Date)
  })

  it('sets a secure cookie in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = cookieSetter()

    refreshTokenGenerator(UID, ROLE_PARTNER, EMAIL, res)

    const [, , options] = lastCookie(res)
    expect(options).toMatchObject({
      sameSite: 'none',
      httpOnly: true,
      secure: true
    })
  })
})

describe('confirmationTokenGenerator', () => {
  it('signs a 1 day confirmation token with the email', () => {
    const token = defined(confirmationTokenGenerator(EMAIL))

    expect(
      jwt.verify(token, process.env.CONFIRMATION_ACCOUNT_KEY ?? '')
    ).toMatchObject({ email: EMAIL })
    expect(lifetime(token)).toBe(ONE_DAY_IN_SECONDS)
  })
})

describe('resetPassTokenGenerator', () => {
  it('signs a 1 day token with a key tied to the current password hash', () => {
    const { resetPasswordToken, expiresIn } = resetPassTokenGenerator(
      UID,
      'hash'
    )

    expect(expiresIn).toBe(ONE_DAY_IN_SECONDS)
    expect(
      jwt.verify(
        resetPasswordToken,
        `${process.env.RESET_PASSWORD_KEY ?? ''}hash`
      )
    ).toMatchObject({ uid: UID })
    expect(() =>
      jwt.verify(
        resetPasswordToken,
        `${process.env.RESET_PASSWORD_KEY ?? ''}other-hash`
      )
    ).toThrow('invalid signature')
  })
})
