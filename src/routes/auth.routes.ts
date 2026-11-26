import { Router } from 'express'
import {
  changePassword,
  confirmAccount,
  rememberPassword,
  login,
  logout,
  refreshAccessToken,
  register,
  reSendConfirmAccountLink,
  resetPassword
} from '../controllers/auth.controllers.ts'
import {
  changePassDataValidations,
  confirmationTokenValidations,
  emailValidations,
  loginDataValidations,
  registryDataValidations,
  resetPassDataValidations,
  uidParamValidations
} from '../middlewares/validateData.middleware.ts'
import { requireRefreshToken } from '../middlewares/requireRefreshToken.middleware.ts'
import { requireAccessToken } from '../middlewares/requireAccessToken.middleware.ts'
import {
  loginRateLimit,
  mailRateLimit
} from '../middlewares/rateLimit.middleware.ts'
const router = Router()

router.get('/refreshToken', requireRefreshToken, refreshAccessToken)
router.get('/logout', logout)
router.post('/register', mailRateLimit, registryDataValidations, register)
router.post('/login', loginRateLimit, loginDataValidations, login)
router.post(
  '/remember-password',
  mailRateLimit,
  emailValidations,
  rememberPassword
)
router.post(
  '/resend-confirm-account',
  mailRateLimit,
  emailValidations,
  reSendConfirmAccountLink
)
router.patch(
  '/change-password',
  requireAccessToken,
  changePassDataValidations,
  changePassword
)
router.patch(
  '/reset-password/:uid/:resetPasswordToken',
  uidParamValidations,
  resetPassDataValidations,
  resetPassword
)
router.patch(
  '/confirm-account/:confirmationToken',
  confirmationTokenValidations,
  confirmAccount
)

export default router
