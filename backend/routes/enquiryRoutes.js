import express from "express";
import {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  getDashboardStats,
} from "../controllers/enquiryController.js";
import { protect } from "../middleware/auth.js";
import { rateLimit } from "express-rate-limit";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many enquiries. Please try again later." },
});

router.post(
  "/",
  enquiryLimiter,
  body("name").isString().trim().isLength({ min: 2, max: 120 }),
  body("phone").isString().trim().matches(/^\+?[0-9\s().-]{7,20}$/),
  body("email").optional({ values: "falsy" }).isEmail().normalizeEmail(),
  body("message").optional().isString().trim().isLength({ max: 2500 }),
  body("product").optional({ values: "falsy" }).isMongoId(),
  body("website").optional().isString().isLength({ max: 200 }),
  validateRequest,
  createEnquiry,
);
router.get("/", protect, getEnquiries);
router.get("/stats/dashboard", protect, getDashboardStats);
router.patch("/:id", protect, updateEnquiryStatus);
router.delete("/:id", protect, deleteEnquiry);

export default router;
