import express from "express";
import { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } from "../controllers/couponController.js";
import { protect } from "../middleware/auth.js";
import { protectUser } from "../middleware/userAuth.js";

const router = express.Router();

router.post("/validate", protectUser, validateCoupon);
router.get("/", protect, getCoupons);
router.post("/", protect, createCoupon);
router.put("/:id", protect, updateCoupon);
router.delete("/:id", protect, deleteCoupon);

export default router;
