import type {
  ConfirmationTokenPayload,
  ResetPasswordTokenPayload,
  TokenPayload
} from '../types/tokens.ts'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const readTokenPayload = (decoded: unknown): TokenPayload => {
  if (
    !isRecord(decoded) ||
    typeof decoded.uid !== 'string' ||
    typeof decoded.role !== 'number' ||
    typeof decoded.email !== 'string'
  ) {
    throw new Error('invalid token')
  }

  return { uid: decoded.uid, role: decoded.role, email: decoded.email }
}

export const readConfirmationTokenPayload = (
  decoded: unknown
): ConfirmationTokenPayload => {
  if (!isRecord(decoded) || typeof decoded.email !== 'string') {
    throw new Error('invalid token')
  }

  return { email: decoded.email }
}

export const readResetPasswordTokenPayload = (
  decoded: unknown
): ResetPasswordTokenPayload => {
  if (!isRecord(decoded) || typeof decoded.uid !== 'string') {
    throw new Error('invalid token')
  }

  return { uid: decoded.uid }
}
