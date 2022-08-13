import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
} from "../controllers/tasks.controller.js";
import { requireAccessToken } from "../middlewares/requireAccessToken.js";
import {
  idParamValidations,
  paginationParamsValidations,
  taskDataValidations,
} from "../middlewares/validateData.js";
const router = Router();

router.get("/", requireAccessToken, paginationParamsValidations, getTasks);
router.get("/:id", requireAccessToken, idParamValidations, getTask);
router.post("/", requireAccessToken, taskDataValidations, createTask);
router.delete("/:id", requireAccessToken, idParamValidations, deleteTask);
router.patch(
  "/:id",
  requireAccessToken,
  idParamValidations,
  taskDataValidations,
  updateTask
);

export default router;
