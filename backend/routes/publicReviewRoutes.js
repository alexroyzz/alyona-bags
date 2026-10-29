import express from "express";
import { param } from "express-validator";
import { getPublicReviews, getMyReviews, createReviewForCatalog, updateOwnReview } from "../controllers/reviewController.js";
import { protectUser } from "../middleware/userAuth.js";
import { reviewIpLimiter, reviewSubmissionGuard } from "../middleware/reviewRateLimiters.js";
import { validateRequest } from "../middleware/validateRequest.js";
import upload from "../middleware/upload.js";
import { MAX_REVIEW_PHOTOS } from "../config/reviewLimits.js";

const router = express.Router();
router.get("/", getPublicReviews);
router.get("/mine", protectUser, getMyReviews);
// Order matters: IP limit -> JWT auth -> per-account guard (limit + one-at-a-time) -> file upload.
router.post("/", reviewIpLimiter, protectUser, reviewSubmissionGuard, upload.array("images", MAX_REVIEW_PHOTOS), createReviewForCatalog);
router.put("/:id", reviewIpLimiter, protectUser, param("id").isMongoId(), validateRequest, reviewSubmissionGuard, upload.array("images", MAX_REVIEW_PHOTOS), updateOwnReview);

export default router;
