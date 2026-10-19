
import express from "express";

import {
    getAdvisorDashboard,
} from "../controllers/advisorDashboard.controller.js";

import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = express.Router();

router.get(
    "/summary",
    protect,
    authorize("advisor"),
    getAdvisorDashboard
);

export default router;
