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

const router = express.Router();

// Customer routes
router.post("/", protectUser, placeOrder);
router.get("/mine", protectUser, getMyOrders);
router.get("/mine/:id", protectUser, getMyOrderById);
router.patch("/mine/:id/cancel", protectUser, cancelOrder);

// Admin routes
router.get("/", protect, getAllOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id", protect, updateOrderStatus);
router.delete("/:id", protect, deleteOrder);

export default router;
