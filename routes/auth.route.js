import { Router } from "express";
import {
  confirmAccount,
  login,
  logout,
  refreshAccessToken,
  register,
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
router.get(
  "/confirm-account/:confirmation_token",
  confirmationTokenParamValidations,
  confirmAccount
);

export default router;
