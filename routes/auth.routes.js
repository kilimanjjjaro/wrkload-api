import { Router } from "express";
import {
  changePassword,
  confirmAccount,
  forgotPassword,
  login,
  logout,
  refreshAccessToken,
  register,
  reSendConfirmAccountLink,
  resetPassword,
} from "../controllers/auth.controllers.js";
import {
  changePassDataValidations,
  confirmationTokenValidations,
  emailValidations,
  loginDataValidations,
  registryDataValidations,
  resetPassDataValidations,
  uidParamValidations,
} from "../middlewares/validateData.middleware.js";
import { requireRefreshToken } from "../middlewares/requireRefreshToken.middleware.js";
import { requireAccessToken } from "../middlewares/requireAccessToken.middleware.js";
const router = Router();

router.get("/token", requireRefreshToken, refreshAccessToken);
router.get("/logout", logout);
router.post("/register", registryDataValidations, register);
router.post("/login", loginDataValidations, login);
router.post("/forgot-password", emailValidations, forgotPassword);
router.post(
  "/resend-confirm-account",
  emailValidations,
  reSendConfirmAccountLink
);
router.patch(
  "/change-password",
  requireAccessToken,
  changePassDataValidations,
  changePassword
);
router.patch(
  "/reset-password/:uid/:resetPasswordToken",
  uidParamValidations,
  resetPassDataValidations,
  resetPassword
);
router.patch(
  "/confirm-account/:confirmationToken",
  confirmationTokenValidations,
  confirmAccount
);

export default router;
