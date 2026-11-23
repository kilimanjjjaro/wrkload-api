import jwt from 'jsonwebtoken'
import { describe, expect, it, vi } from 'vitest'
import {
  confirmationTokenGenerator,
  refreshTokenGenerator,
  resetPassTokenGenerator,
  tokenGenerator
} from '../../utils/tokenManager.js'

const UID = '6439b01cf35b6e22570cd000'
const EMAIL = 'kili@wrkload.test'
const ONE_DAY = 60 * 60 * 24

const decode = (token: string) => jwt.decode(token) as jwt.JwtPayload

describe('tokenGenerator', () => {
  it('signs a 15 minutes access token', () => {
    const { accessToken, expiresIn } = tokenGenerator(UID, 3, EMAIL)

    expect(expiresIn).toBe(60 * 15)
    expect(jwt.verify(accessToken, process.env.ACCESS_KEY ?? '')).toMatchObject(
      { uid: UID, role: 3, email: EMAIL }
    )

    const payload = decode(accessToken)
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(expiresIn)
  })
})

describe('refreshTokenGenerator', () => {
  it('signs a 30 days refresh token and sets it as a cookie', () => {
    const res = { cookie: vi.fn() }

    const { refreshToken, expiresIn } = refreshTokenGenerator(
      UID,
      3,
      EMAIL,
      res
    )

    expect(expiresIn).toBe(ONE_DAY * 30)
    expect(
      jwt.verify(refreshToken, process.env.REFRESH_KEY ?? '')
    ).toMatchObject({ uid: UID, role: 3, email: EMAIL })
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', refreshToken, {
      sameSite: 'lax',
      httpOnly: false,
      secure: false,
      expires: expect.any(Date)
    })
  })

  it('sets a secure cookie in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = { cookie: vi.fn() }

    refreshTokenGenerator(UID, 3, EMAIL, res)

    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.any(String),
      expect.objectContaining({
        sameSite: 'none',
        httpOnly: true,
        secure: true
      })
    )
  })
})

describe('confirmationTokenGenerator', () => {
  it('signs a 1 day confirmation token with the email', () => {
    const token = confirmationTokenGenerator(EMAIL)

    expect(
      jwt.verify(token, process.env.CONFIRMATION_ACCOUNT_KEY ?? '')
    ).toMatchObject({ email: EMAIL })

    const payload = decode(token)
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(ONE_DAY)
  })
})

describe('resetPassTokenGenerator', () => {
  it('signs a 1 day token with a key tied to the current password hash', () => {
    const { resetPasswordToken, expiresIn } = resetPassTokenGenerator(
      UID,
      'hash'
    )

    expect(expiresIn).toBe(ONE_DAY)
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
