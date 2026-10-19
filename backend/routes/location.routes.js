import express from "express";
import {
    listAdvisors,
    getAdvisor,
    createAdvisor,
    updateAdvisor,
    setAdvisorStatus,
} from "../controllers/advisor.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, authorize("admin"), listAdvisors);
router.get("/:id", protect, authorize("admin"), getAdvisor);
router.post("/", protect, authorize("admin"), createAdvisor);
router.put("/:id", protect, authorize("admin"), updateAdvisor);
router.patch("/:id/status", protect, authorize("admin"), setAdvisorStatus);

export default router;
