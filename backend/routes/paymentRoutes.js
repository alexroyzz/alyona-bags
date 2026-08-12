import express from "express";
import { createRazorpayOrder } from "../controllers/paymentController.js";
import { protectUser } from "../middleware/userAuth.js";

const router = express.Router();

router.post("/razorpay/order", protectUser, createRazorpayOrder);

export default router;
