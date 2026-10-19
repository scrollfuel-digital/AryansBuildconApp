
import express from "express";

import {
    getDashboardSummary,
    getActiveAdvisors,
    getRecentVisits,
} from "../controllers/dashboard.controller.js";

import protect from "../middleware/auth.middleware.js";
import authorize  from "../middleware/role.middleware.js";

const router = express.Router();

router.get(
    "/summary",
    protect,
    authorize("admin"),
    getDashboardSummary
);

router.get(
    "/active-advisors",
    protect,
    authorize("admin"),
    getActiveAdvisors
);

router.get(
    "/recent-visits",
    protect,
    authorize("admin"),
    getRecentVisits
);

export default router;
