import { Router } from "express";
import {
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controllers/users.controllers.js";
import { requireAccessToken } from "../middlewares/requireAccessToken.middleware.js";
import {
  usersParamsValidations,
  uidParamValidations,
  updateDataValidations,
} from "../middlewares/validateData.middleware.js";
const router = Router();

router.get("/", requireAccessToken, usersParamsValidations, getUsers);
router.get("/:uid", requireAccessToken, uidParamValidations, getUser);
router.delete("/:uid", requireAccessToken, uidParamValidations, deleteUser);
router.patch(
  "/:uid",
  requireAccessToken,
  uidParamValidations,
  updateDataValidations,
  updateUser
);

export default router;
