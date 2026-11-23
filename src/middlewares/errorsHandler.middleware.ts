import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNAUTHORIZED
} from '../constants/index.ts'
import { logError } from '../utils/logger.ts'

interface ApiError {
  httpStatus: number
  code: string
  message: string
}

const API_ERRORS = new Map<string, ApiError>([
  // TOKENS ERRORS
  [
    'invalid signature',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'token/invalid-signature',
      message: 'Invalid token signature'
    }
  ],
  [
    'jwt expired',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'token/token-expired',
      message: 'Token expired'
    }
  ],
  [
    'jwt malformed',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'token/invalid-token-format',
      message: 'Invalid bearer token format'
    }
  ],
  [
    'invalid token',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'token/invalid-token',
      message: 'Invalid token'
    }
  ],
  [
    'Token not found',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'token/token-not-found',
      message: 'Token not found'
    }
  ],
  [
    'Invalid reset link',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'token/token-not-found',
      message: 'Invalid reset password link'
    }
  ],

  // AUTHORIZATION ERRORS
  [
    'New password is required',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'auth/password-required',
      message: 'New password is required'
    }
  ],
  [
    'User already exists',
    {
      httpStatus: HTTP_STATUS_FORBIDDEN,
      code: 'auth/email-already-exists',
      message: 'User already exists'
    }
  ],
  [
    'User not found',
    {
      httpStatus: HTTP_STATUS_FORBIDDEN,
      code: 'auth/user-not-found',
      message: 'Wrong email or password'
    }
  ],
  [
    'Account already confirmed',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'auth/account-already-confirmed',
      message: 'This account is already confirmed'
    }
  ],
  [
    'Account not confirmed',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'auth/account-not-confirmed',
      message: 'Please check your email to confirm account'
    }
  ],
  [
    'Wrong password',
    {
      httpStatus: HTTP_STATUS_FORBIDDEN,
      code: 'auth/invalid-credentials',
      message: 'Wrong email or password'
    }
  ],
  [
    'Same new password',
    {
      httpStatus: HTTP_STATUS_FORBIDDEN,
      code: 'auth/invalid-credentials',
      message: 'Wrong email or password'
    }
  ],
  [
    'User not found to reset password',
    {
      httpStatus: HTTP_STATUS_FORBIDDEN,
      code: 'auth/user-not-found',
      message: 'Check your email for reset your password'
    }
  ],
  [
    'Empty fields',
    {
      httpStatus: HTTP_STATUS_FORBIDDEN,
      code: 'auth/empty-fields',
      message: 'All fields are required'
    }
  ],

  // TASKS ERRORS
  [
    'Tasks not found',
    {
      httpStatus: HTTP_STATUS_NOT_FOUND,
      code: 'tasks/tasks-not-found',
      message: 'Tasks not found'
    }
  ],
  [
    'Task not found',
    {
      httpStatus: HTTP_STATUS_NOT_FOUND,
      code: 'tasks/task-not-found',
      message: 'Task not found'
    }
  ],
  [
    "Can't read other authors tasks",
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'tasks/permission-denied',
      message: "Can't read other authors tasks"
    }
  ],
  [
    "Can't update other authors tasks",
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'tasks/permission-denied',
      message: "Can't update other authors tasks"
    }
  ],
  [
    "Can't delete other authors tasks",
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'tasks/permission-denied',
      message: "Can't delete other authors tasks"
    }
  ],
  [
    "Can't update ID data",
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'tasks/permission-denied',
      message: "Can't update ID data"
    }
  ],
  [
    "Can't update this data",
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'tasks/permission-denied',
      message: "Can't update this data"
    }
  ],

  // USERS ERRORS
  [
    'Permission denied',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'users/permission-denied',
      message: 'Permission denied'
    }
  ],
  [
    'Users not found',
    {
      httpStatus: HTTP_STATUS_NOT_FOUND,
      code: 'users/users-not-found',
      message: 'Users not found'
    }
  ],
  [
    "User doesn't exist",
    {
      httpStatus: HTTP_STATUS_NOT_FOUND,
      code: 'users/user-not-found',
      message: "This user doesn't exist"
    }
  ],

  // PROJECTS ERRORS
  [
    'Projects not found',
    {
      httpStatus: HTTP_STATUS_NOT_FOUND,
      code: 'projects/projects-not-found',
      message: 'Projects not found'
    }
  ],
  [
    'Project not found',
    {
      httpStatus: HTTP_STATUS_NOT_FOUND,
      code: 'projects/project-not-found',
      message: 'Project not found'
    }
  ],
  [
    "Can't read other authors projects",
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'projects/permission-denied',
      message: "Can't read other authors projects"
    }
  ],
  [
    "Can't update other authors projects",
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'projects/permission-denied',
      message: "Can't update other authors projects"
    }
  ],
  [
    "Can't delete other authors projects",
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'projects/permission-denied',
      message: "Can't delete other authors projects"
    }
  ],
  [
    "Can't update this project data",
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'projects/permission-denied',
      message: "Can't update this data"
    }
  ],
  [
    'Project already exists',
    {
      httpStatus: HTTP_STATUS_FORBIDDEN,
      code: 'projects/project-already-exists',
      message: 'Project already exists'
    }
  ],

  [
    'Nothing to update',
    {
      httpStatus: HTTP_STATUS_BAD_REQUEST,
      code: 'request/nothing-to-update',
      message: 'Nothing to update'
    }
  ],

  // TRIAL ACCOUNT ERRORS
  [
    'Trial account detected',
    {
      httpStatus: HTTP_STATUS_UNAUTHORIZED,
      code: 'trial/permission-denied',
      message: 'This is a trial account'
    }
  ],
  [
    'Not allowed by CORS',
    {
      httpStatus: HTTP_STATUS_FORBIDDEN,
      code: 'cors/origin-not-allowed',
      message: 'Origin not allowed'
    }
  ]
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const clientRequestError = (err: unknown): ApiError | undefined => {
  if (!isRecord(err) || err.expose !== true) return undefined

  const { status, type, message } = err

  if (
    typeof status !== 'number' ||
    status < HTTP_STATUS_BAD_REQUEST ||
    status >= HTTP_STATUS_INTERNAL_SERVER_ERROR
  )
    return undefined

  if (type === 'entity.parse.failed') {
    return {
      httpStatus: status,
      code: 'request/invalid-json',
      message: 'Invalid JSON body'
    }
  }

  return {
    httpStatus: status,
    code: 'request/invalid-body',
    message: typeof message === 'string' ? message : 'Invalid request body'
  }
}

const invalidIdError = (err: unknown): ApiError | undefined =>
  err instanceof mongoose.Error.CastError && err.kind === 'ObjectId'
    ? {
        httpStatus: HTTP_STATUS_FORBIDDEN,
        code: 'auth/id-not-valid',
        message: 'ID not valid'
      }
    : undefined

const errorsHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const message = err instanceof Error ? err.message : undefined
  const apiError =
    (message === undefined ? undefined : API_ERRORS.get(message)) ??
    invalidIdError(err) ??
    clientRequestError(err)

  // UNTRACKED ERRORS
  if (apiError === undefined) {
    logError(err)
    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
      status: 'error',
      code: 'server/unhandled-error',
      message: 'Internal server error'
    })
    return
  }

  res.status(apiError.httpStatus).json({
    status: 'error',
    code: apiError.code,
    message: apiError.message
  })
}

export default errorsHandler
