import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { User } from '../../models/User.js'
import { DEFAULT_PASSWORD, ROLES } from '../constants/api.ts'

interface CreateUserOptions {
  _id?: string
  username?: string
  email?: string
  password?: string
  role?: number
  confirmed?: boolean
  lastActiveAt?: string
}

export const createUser = async (options: CreateUserOptions = {}) => {
  const id = options._id ?? new mongoose.Types.ObjectId().toString()

  const user = new User({
    _id: id,
    username: options.username ?? `user-${id}`,
    email: options.email ?? `${id}@wrkload.test`,
    avatar: 'https://wrkload.test/avatar.png',
    password: options.password ?? DEFAULT_PASSWORD,
    role: options.role ?? ROLES.partner,
    registeredAt: '2026-01-01T00:00:00-03:00',
    lastActiveAt: options.lastActiveAt ?? '',
    confirmationStatus: options.confirmed ?? true
  })

  await user.save()

  return user
}

export const signAccessToken = (
  user: { _id: unknown; role: number; email: string },
  options: jwt.SignOptions = { expiresIn: 60 }
) =>
  jwt.sign(
    { uid: user._id, role: user.role, email: user.email },
    process.env.ACCESS_KEY ?? '',
    options
  )

export const bearer = (user: { _id: unknown; role: number; email: string }) =>
  `Bearer ${signAccessToken(user)}`

export const createUserWithToken = async (options: CreateUserOptions = {}) => {
  const user = await createUser(options)

  return { user, authorization: bearer(user) }
}
