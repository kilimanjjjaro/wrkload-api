import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
} from "../controllers/tasks.controllers.js";
import { requireAccessToken } from "../middlewares/requireAccessToken.middleware.js";
import {
  idParamValidations,
  tasksParamsValidations,
  taskDataValidations,
} from "../middlewares/validateData.middleware.js";
const router = Router();

router.get("/", requireAccessToken, tasksParamsValidations, getTasks);
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
