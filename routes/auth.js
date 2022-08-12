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
} from "../controllers/auth.controller.js";
import {
  changePassDataValidations,
  confirmationTokenValidations,
  emailValidations,
  loginDataValidations,
  registryDataValidations,
  resetPassDataValidations,
  uidParamValidations,
} from "../middlewares/validateData.js";
import { requireRefreshToken } from "../middlewares/requireRefreshToken.js";
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
router.patch("/change-password", changePassDataValidations, changePassword);
router.patch(
  "/reset-password/:uid/:reset_password_token",
  uidParamValidations,
  resetPassDataValidations,
  resetPassword
);
router.patch(
  "/confirm-account/:confirmation_token",
  confirmationTokenValidations,
  confirmAccount
);

export default router;
