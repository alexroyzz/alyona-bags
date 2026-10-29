import express from "express";
import { param } from "express-validator";
import { deleteReview, getAdminReviews, updateReviewDisplayName, updateReviewPublication, updateReviewStatus } from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();
router.use(protect);
router.get("/", getAdminReviews);
router.patch("/:id/status", param("id").isMongoId(), validateRequest, updateReviewStatus);
router.patch("/:id/publication", param("id").isMongoId(), validateRequest, updateReviewPublication);
router.patch("/:id/display", param("id").isMongoId(), validateRequest, updateReviewDisplayName);
router.delete("/:id", param("id").isMongoId(), validateRequest, deleteReview);

export default router;
