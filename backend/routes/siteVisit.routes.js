import express from "express";
import {
  createSiteVisit,
  listSiteVisits,
  listMySiteVisits,
  getSiteVisit,
  updateSiteVisit,
  cancelSiteVisit,
  deleteSiteVisit,
  listProjectVisits,
} from "../controllers/siteVisit.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("advisor"), createSiteVisit);
router.get("/my", protect, authorize("advisor"), listMySiteVisits);
router.get("/project/:projectId", protect, listProjectVisits);
router.get("/", protect, listSiteVisits);
router.get("/:id", protect, getSiteVisit);
router.put("/:id", protect, updateSiteVisit);
router.delete("/:id", protect, (req, res, next) => {
  if (req.user?.role === "admin") {
    return deleteSiteVisit(req, res, next);
  }
  return cancelSiteVisit(req, res, next);
});

export default router;
