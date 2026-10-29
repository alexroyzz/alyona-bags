import express from "express";
import { createRazorpayOrder } from "../controllers/paymentController.js";
import { protectUser } from "../middleware/userAuth.js";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.post("/razorpay/order", protectUser, body("amount").isFloat({ min: 0.01, max: 99999999.99 }), validateRequest, createRazorpayOrder);

export default router;
