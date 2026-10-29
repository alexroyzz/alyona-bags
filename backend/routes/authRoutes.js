import express from "express";
import { loginAdmin, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";
import { authRateLimiters } from "../middleware/authRateLimiters.js";

const router = express.Router();

router.post(
  "/login",
  authRateLimiters.adminLogin.ip,
  authRateLimiters.adminLogin.account,
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().isLength({ min: 1, max: 128 }).withMessage("Password is required"),
  validateRequest,
  loginAdmin,
);
router.get("/me", protect, getMe);

export default router;
