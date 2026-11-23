export interface TokenPayload {
  uid: string
  role: number
  email: string
}

export interface ConfirmationTokenPayload {
  email: string
}

export interface ResetPasswordTokenPayload {
  uid: string
}
