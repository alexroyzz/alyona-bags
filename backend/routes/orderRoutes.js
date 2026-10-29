import express from "express";
import {
  placeOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";
import { protectUser } from "../middleware/userAuth.js";
import { body, param } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

// Customer routes
router.post(
  "/",
  protectUser,
  body("paymentMethod").optional().isIn(["razorpay", "cod"]),
  body("shippingAddress.fullName").isString().trim().isLength({ min: 1, max: 120 }),
  body("shippingAddress.phone").matches(/^[6-9]\d{9}$/),
  body("shippingAddress.line1").isString().trim().isLength({ min: 1, max: 250 }),
  ...["line2", "city", "state", "pincode", "country"].map((field) =>
    body(`shippingAddress.${field}`).optional().isString().isLength({ max: 250 }),
  ),
  body("notes").optional().isString().isLength({ max: 2000 }),
  body("razorpay.orderId").optional().isString().isLength({ max: 100 }),
  body("razorpay.paymentId").optional().isString().isLength({ max: 100 }),
  body("razorpay.signature").optional().isHexadecimal().isLength({ min: 64, max: 64 }),
  validateRequest,
  placeOrder,
);
router.get("/mine", protectUser, getMyOrders);
router.get("/mine/:id", protectUser, param("id").isMongoId(), validateRequest, getMyOrderById);
router.patch("/mine/:id/cancel", protectUser, param("id").isMongoId(), validateRequest, cancelOrder);

// Admin routes
router.get("/", protect, getAllOrders);
router.get("/:id", protect, param("id").isMongoId(), validateRequest, getOrderById);
router.patch(
  "/:id",
  protect,
  param("id").isMongoId(),
  body("orderStatus").optional().isIn(["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  body("trackingNumber").optional().isString().isLength({ max: 120 }),
  body("note").optional().isString().isLength({ max: 1000 }),
  validateRequest,
  updateOrderStatus,
);
router.delete("/:id", protect, param("id").isMongoId(), validateRequest, deleteOrder);

export default router;
