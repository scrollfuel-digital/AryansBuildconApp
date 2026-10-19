import express from "express";
import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/advisor.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/advisor", protect, authorize("advisor"), getMyProfile);
router.put("/advisor", protect, authorize("advisor"), updateMyProfile);
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

export default router;
