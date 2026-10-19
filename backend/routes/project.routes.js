import express from "express";

import {
    listProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
} from "../controllers/project.controller.js";

import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, listProjects);
router.get("/:id", protect, getProject);
router.post("/", protect, authorize("admin"), createProject);
router.put("/:id", protect, authorize("admin"), updateProject);
router.delete("/:id", protect, authorize("admin"), deleteProject);

export default router;