import { Router } from "express";
import {
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
  confirmationTokenParamValidations,
  loginDataValidations,
  registryDataValidations,
} from "../middlewares/validateData.js";
import { requireRefreshToken } from "../middlewares/requireRefreshToken.js";
const router = Router();

//CREATE ROUTES WITH METHODS TYPES ALLOWED.
router.post("/register", registryDataValidations, register);
router.post("/login", loginDataValidations, login);
router.get("/token", requireRefreshToken, refreshAccessToken);
router.get("/logout", logout);
router.patch("/forgot-password", forgotPassword);
router.patch("/reset-password/:reset_password_token", resetPassword);
router.post("/resend-confirm-account", reSendConfirmAccountLink);
router.get(
  "/confirm-account/:confirmation_token",
  confirmationTokenParamValidations,
  confirmAccount
);

export default router;
