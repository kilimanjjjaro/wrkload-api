import type { RequestHandler } from 'express'
import 'dotenv/config'
import jwt from 'jsonwebtoken'
import dayjs from 'dayjs'
import transporter from '../utils/transporter.ts'
import { User } from '../models/User.ts'
import {
  confirmationTokenGenerator,
  refreshTokenGenerator,
  resetPassTokenGenerator,
  tokenGenerator
} from '../utils/tokenManager.ts'
import confirmAccountMail from '../templates/confirmAccountMail.ts'
import resendConfirmationAccountLinkMail from '../templates/resendConfirmationAccountLinkMail.ts'
import rememberPasswordMail from '../templates/rememberPasswordMail.ts'
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_OK,
  ROLE_PARTNER,
  TRIAL_ACCOUNT_ID
} from '../constants/index.ts'
import type {
  ChangePasswordBody,
  EmailBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  RouteParams
} from '../types/requests.ts'
import { routeParam } from '../utils/requests.ts'
import { env } from '../utils/env.ts'
import { logError } from '../utils/logger.ts'
import {
  readConfirmationTokenPayload,
  readResetPasswordTokenPayload
} from '../utils/tokenPayloads.ts'

const MAIL_FROM = '"wrkload" <wrkload@kilimanjjjaro.com>'

export const register: RequestHandler<
  RouteParams,
  unknown,
  RegisterBody
> = async (req, res, next) => {
  try {
    const {
      body: { username, email, avatar, password }
    } = req
    const existingUser = await User.findOne({ email })

    if (existingUser !== null) throw new Error('User already exists')

    const user = new User({
      username,
      role: ROLE_PARTNER,
      registeredAt: dayjs().format(),
      email,
      avatar,
      password,
      confirmationToken: confirmationTokenGenerator(email),
      confirmationStatus: false
    })

    await user.save()

    await transporter.sendMail({
      from: MAIL_FROM,
      to: user.email,
      subject: 'Confirm your account',
      html: confirmAccountMail(user.confirmationToken)
    })

    res.status(HTTP_STATUS_CREATED).json({ status: 'ok' })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const login: RequestHandler<RouteParams, unknown, LoginBody> = async (
  req,
  res,
  next
) => {
  try {
    const {
      body: { email, password }
    } = req
    const user = await User.findOne({ email })

    if (user === null) throw new Error('User not found')

    if (!user.confirmationStatus) throw new Error('Account not confirmed')

    const reqPass = await user.comparePassword(password)

    if (!reqPass) throw new Error('Wrong password')

    user.lastActiveAt = dayjs().format()

    await user.save()

    const { accessToken, expiresIn } = tokenGenerator(
      user._id,
      user.role,
      user.email
    )

    refreshTokenGenerator(user._id, user.role, user.email, res)

    const secureUser = {
      _id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role
    }

    res
      .status(HTTP_STATUS_OK)
      .json({ status: 'ok', user: secureUser, accessToken, expiresIn })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const refreshAccessToken: RequestHandler = (req, res, next) => {
  try {
    const { accessToken, expiresIn } = tokenGenerator(
      req.uid,
      req.role,
      req.email
    )

    res
      .status(HTTP_STATUS_CREATED)
      .json({ status: 'ok', accessToken, expiresIn })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const logout: RequestHandler = (req, res) => {
  res.clearCookie('refreshToken')
  res.status(HTTP_STATUS_OK).json({ status: 'ok' })
}

export const confirmAccount: RequestHandler = async (req, res, next) => {
  try {
    const confirmationToken = routeParam(req.params.confirmationToken)

    const user = await User.findOne({ confirmationToken })

    if (user === null) throw new Error('Account already confirmed')

    const { email } = readConfirmationTokenPayload(
      jwt.verify(confirmationToken, env('CONFIRMATION_ACCOUNT_KEY'))
    )

    if (email !== user.email) throw new Error('Invalid token')

    user.confirmationStatus = true
    user.confirmationToken = ''

    await user.save()

    res.status(HTTP_STATUS_CREATED).json({ status: 'ok' })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const reSendConfirmAccountLink: RequestHandler<
  RouteParams,
  unknown,
  EmailBody
> = async (req, res, next) => {
  try {
    const {
      body: { email }
    } = req
    const user = await User.findOne({ email })

    if (user === null) throw new Error('User not found')

    if (user.confirmationStatus) throw new Error('Account already confirmed')

    user.confirmationToken = confirmationTokenGenerator(email)

    await user.save()

    await transporter.sendMail({
      from: MAIL_FROM,
      to: user.email,
      subject: 'Confirm your account',
      html: resendConfirmationAccountLinkMail(user.confirmationToken)
    })

    res.status(HTTP_STATUS_CREATED).json({ status: 'ok' })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const changePassword: RequestHandler<
  RouteParams,
  unknown,
  ChangePasswordBody
> = async (req, res, next) => {
  try {
    const {
      body: { oldPassword, newPassword }
    } = req

    if (newPassword === '') throw new Error('Empty fields')

    const user = await User.findById(req.uid)

    if (user === null) throw new Error('User not found')

    if (user._id.equals(TRIAL_ACCOUNT_ID))
      throw new Error('Trial account detected')

    if (!(await user.comparePassword(oldPassword)))
      throw new Error('Wrong password')

    if (await user.comparePassword(newPassword))
      throw new Error('Same new password')

    user.password = newPassword

    await user.save()

    res.status(HTTP_STATUS_CREATED).json({ status: 'ok' })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const rememberPassword: RequestHandler<
  RouteParams,
  unknown,
  EmailBody
> = async (req, res, next) => {
  try {
    const {
      body: { email }
    } = req
    const user = await User.findOne({ email })

    if (user === null) throw new Error('User not found to reset password')

    if (user._id.equals(TRIAL_ACCOUNT_ID))
      throw new Error('Trial account detected')

    const { resetPasswordToken } = resetPassTokenGenerator(
      user._id,
      user.password
    )

    await transporter.sendMail({
      from: MAIL_FROM,
      to: user.email,
      subject: 'Reset your password',
      html: rememberPasswordMail({
        id: user._id.toString(),
        resetPasswordToken
      })
    })

    res.status(HTTP_STATUS_OK).json({ status: 'ok' })
  } catch (error) {
    logError(error)
    next(error)
  }
}

export const resetPassword: RequestHandler<
  RouteParams,
  unknown,
  ResetPasswordBody
> = async (req, res, next) => {
  try {
    const uid = routeParam(req.params.uid)
    const resetPasswordToken = routeParam(req.params.resetPasswordToken)
    const {
      body: { newPassword }
    } = req

    if (resetPasswordToken === '') throw new Error('Invalid reset link')
    if (newPassword === '') throw new Error('New password is required')

    const user = await User.findOne({ _id: uid })

    if (user === null) throw new Error('User not found')

    if (user._id.equals(TRIAL_ACCOUNT_ID))
      throw new Error('Trial account detected')

    const token = env('RESET_PASSWORD_KEY') + user.password

    const { uid: id } = readResetPasswordTokenPayload(
      jwt.verify(resetPasswordToken, token)
    )

    if (!user._id.equals(id)) throw new Error('Invalid token')

    user.password = newPassword

    await user.save()

    res.status(HTTP_STATUS_CREATED).json({ status: 'ok' })
  } catch (error) {
    logError(error)
    next(error)
  }
}
