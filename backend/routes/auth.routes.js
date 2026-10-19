import express from "express";

import {
  advisorLogin,
  adminLogin,
  getMe,
  logout,
  advisorRegister,
} from "../controllers/auth.controller.js";

import {
  sendOTP,
  verifyOTP,
  resendOTP,
} from "../controllers/otp.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// Existing authentication routes
router.post("/advisor/login", advisorLogin);
router.post("/admin/login", adminLogin);
router.post("/advisor/register", advisorRegister);
router.post("/register", advisorRegister);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

// Email OTP routes
router.post("/otp/send", sendOTP);
router.post("/otp/verify", verifyOTP);
router.post("/otp/resend", resendOTP);

export default router;
