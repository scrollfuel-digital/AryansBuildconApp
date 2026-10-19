import express from "express";
import {
  uploadMiddleware,
  uploadSitePhoto,
  deleteSitePhoto,
} from "../controllers/upload.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = express.Router();

router.post(
  "/site-photo",
  protect,
  authorize("advisor", "admin"),
  uploadMiddleware,
  uploadSitePhoto,
);
router.post(
  "/advisor-photo",
  protect,
  authorize("admin"),
  uploadMiddleware,
  uploadSitePhoto,
);
router.delete("/site-photo/:id", protect, authorize("admin"), deleteSitePhoto);

export default router;
