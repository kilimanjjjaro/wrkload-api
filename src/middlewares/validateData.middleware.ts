import type { NextFunction, Request, Response } from 'express'
import { check, param, query, validationResult } from 'express-validator'
import {
  DEFAULT_PAGE,
  HTTP_STATUS_BAD_REQUEST,
  PASSWORD_MIN_LENGTH
} from '../constants/index.ts'

export const manageValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    res.status(HTTP_STATUS_BAD_REQUEST).json({ error: errors.array() })
    return
  }

  next()
}

export const registryDataValidations = [
  check('username')
    .trim()
    .notEmpty()
    .withMessage('Username are required')
    .escape()
    .withMessage('Invalid username format'),
  check('registeredAt').trim().escape(),
  check('lastActiveAt').trim().escape(),
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email are required')
    .bail()
    .isEmail()
    .withMessage('Incorrect email format')
    .normalizeEmail(),
  check('avatar')
    .trim()
    .notEmpty()
    .withMessage('Avatar are required')
    .bail()
    .isURL({ require_tld: false })
    .withMessage('Invalid URL avatar'),
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password are required')
    .bail()
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage('Password must have a minimum of 8 characters'),
  manageValidationErrors
]

export const updateDataValidations = [
  check('username')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Username are required')
    .escape()
    .withMessage('Invalid username format'),
  check('avatar')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Avatar are required')
    .bail()
    .isURL({ require_tld: false })
    .withMessage('Invalid URL avatar'),
  manageValidationErrors
]

export const loginDataValidations = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email are required')
    .bail()
    .isEmail()
    .withMessage('Incorrect email format')
    .normalizeEmail(),
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password are required')
    .bail()
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage('Password must have a minimum of 8 characters'),
  manageValidationErrors
]

export const changePassDataValidations = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email are required')
    .bail()
    .isEmail()
    .withMessage('Incorrect email format')
    .normalizeEmail(),
  check('oldPassword')
    .trim()
    .notEmpty()
    .withMessage('Password are required')
    .bail()
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage('Password must have a minimum of 8 characters'),
  check('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password are required')
    .bail()
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage('New password must have a minimum of 8 characters'),
  manageValidationErrors
]

export const emailValidations = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email are required')
    .bail()
    .isEmail()
    .withMessage('Incorrect email format'),
  manageValidationErrors
]

export const taskDataValidations = [
  check('title').trim().notEmpty().withMessage('Title are required').escape(),
  check('project')
    .trim()
    .notEmpty()
    .withMessage('Project are required')
    .escape(),
  check('createdAt').trim().escape(),
  check('updatedAt').trim().escape(),
  check('timing').trim().notEmpty().withMessage('Timing are required').escape(),
  check('deliveredAt')
    .trim()
    .notEmpty()
    .withMessage('DeliveryAt are required')
    .bail()
    .isISO8601()
    .withMessage('Invalid date format. ISO8601 required')
    .bail(),
  check('description').trim().escape(),
  manageValidationErrors
]

export const idParamValidations = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('ID are required')
    .bail()
    .escape()
    .withMessage('Invalid ID param format'),
  manageValidationErrors
]

export const uidParamValidations = [
  param('uid')
    .trim()
    .notEmpty()
    .withMessage('User ID are required')
    .bail()
    .escape()
    .withMessage('Invalid user ID param format'),
  manageValidationErrors
]

export const confirmationTokenValidations = [
  param('confirmationToken')
    .trim()
    .notEmpty()
    .withMessage('Confirmation token are required')
    .bail()
    .escape()
    .withMessage('Invalid confirmation token param format'),
  manageValidationErrors
]

export const resetPassDataValidations = [
  param('resetPasswordToken')
    .trim()
    .notEmpty()
    .withMessage('Reset password token are required')
    .bail()
    .escape()
    .withMessage('Invalid reset password token param format'),
  check('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password are required')
    .bail()
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage('New password must have a minimum of 8 characters'),
  manageValidationErrors
]

export const tasksParamsValidations = [
  query('project')
    .exists()
    .withMessage('Project parameter are required')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Project parameter cannot be empty'),
  query('page').trim().escape().default(DEFAULT_PAGE),
  query('limit').trim().escape(),
  query('search').trim().unescape(),
  manageValidationErrors
]

export const projectsParamsValidations = [
  query('page').trim().escape().default(DEFAULT_PAGE),
  query('limit').trim().escape(),
  manageValidationErrors
]

export const usersParamsValidations = [
  query('page').trim().escape().default(DEFAULT_PAGE),
  query('limit').trim().escape(),
  manageValidationErrors
]

export const projectDataValidations = [
  check('name').trim().notEmpty().withMessage('Name are required').escape(),
  manageValidationErrors
]
