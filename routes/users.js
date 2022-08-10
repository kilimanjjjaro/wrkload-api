import { Router } from "express";
import {
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controllers/users.controller.js";
import { requireAccessToken } from "../middlewares/requireAccessToken.js";
import {
  idParamValidations,
  registryDataValidations,
  updateDataValidations,
} from "../middlewares/validateData.js";
const router = Router();

router.get("/", requireAccessToken, getUsers);
router.get("/:id", requireAccessToken, idParamValidations, getUser);
router.delete("/:id", requireAccessToken, idParamValidations, deleteUser);
router.patch(
  "/:id",
  requireAccessToken,
  idParamValidations,
  updateDataValidations,
  updateUser
);

export default router;
