import express from "express";
import {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  getDashboardStats,
} from "../controllers/enquiryController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createEnquiry);
router.get("/", protect, getEnquiries);
router.get("/stats/dashboard", protect, getDashboardStats);
router.patch("/:id", protect, updateEnquiryStatus);
router.delete("/:id", protect, deleteEnquiry);

export default router;
