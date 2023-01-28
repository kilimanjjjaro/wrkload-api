import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from "../controllers/projects.controllers.js";
import { requireAccessToken } from "../middlewares/requireAccessToken.middleware.js";
import {
  idParamValidations,
  projectDataValidations,
  projectsParamsValidations,
} from "../middlewares/validateData.middleware.js";
const router = Router();

router.get("/", requireAccessToken, projectsParamsValidations, getProjects);
router.get("/:id", requireAccessToken, idParamValidations, getProject);
router.post("/", requireAccessToken, projectDataValidations, createProject);
router.delete("/:id", requireAccessToken, idParamValidations, deleteProject);
router.patch(
  "/:id",
  requireAccessToken,
  idParamValidations,
  projectDataValidations,
  updateProject
);

export default router;
