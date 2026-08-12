import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { generateOrderNumber } from "../utils/generateOrderNumber.js";
import { verifyRazorpaySignature } from "./paymentController.js";
import { generateInvoicePDF } from "../utils/generateInvoice.js";
import {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
} from "../utils/sendEmail.js";

const SHIPPING_FEE = 0; // free shipping storewide for now; adjust as needed

// @desc    Place an order from the current cart (COD or after Razorpay payment)
// @route   POST /api/orders
// @access  Private (User)
export const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, couponCode, paymentMethod, razorpay, notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
  );
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("Your cart is empty");
  }

  if (
    !shippingAddress?.fullName ||
    !shippingAddress?.phone ||
    !shippingAddress?.line1
  ) {
    res.status(400);
    throw new Error("A complete shipping address is required");
  }

  // Build line items + subtotal from live product data (never trust client-sent prices)
  let subtotal = 0;
  const items = cart.items.map((ci) => {
    const p = ci.product;
    const unitPrice = p.discountPrice > 0 ? p.discountPrice : p.price;
    subtotal += unitPrice * ci.quantity;

    return {
      product: p._id,
      name: p.name,
      image: p.images?.[0]?.url || "",
      price: unitPrice,
      quantity: ci.quantity,
      color: ci.color,

      // NEW
      printingType: ci.printingType || "plain",
      logo: ci.logo || {},
      instructions: ci.instructions || "",
    };
  });

  // Apply coupon if provided
  let discount = 0;
  let appliedCode = "";
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });
    if (
      coupon &&
      (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
      subtotal >= coupon.minOrderValue
    ) {
      discount =
        coupon.discountType === "percentage"
          ? (subtotal * coupon.discountValue) / 100
          : coupon.discountValue;
      if (
        coupon.discountType === "percentage" &&
        coupon.maxDiscountAmount > 0
      ) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
      discount = Math.min(discount, subtotal);
      appliedCode = coupon.code;
      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  const total = Math.round(subtotal - discount + SHIPPING_FEE);

  // Payment verification for Razorpay orders
  let paymentStatus = "pending";
  if (paymentMethod === "razorpay") {
    if (!razorpay?.orderId || !razorpay?.paymentId || !razorpay?.signature) {
      res.status(400);
      throw new Error("Payment verification details are missing");
    }
    const valid = verifyRazorpaySignature(razorpay);
    if (!valid) {
      res.status(400);
      throw new Error("Payment verification failed — signature mismatch");
    }
    paymentStatus = "paid";
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user._id,
    items,
    shippingAddress,
    subtotal: Math.round(subtotal),
    discount: Math.round(discount),
    couponCode: appliedCode,
    shippingFee: SHIPPING_FEE,
    total,
    paymentMethod: paymentMethod || "razorpay",
    paymentStatus,
    razorpay: paymentMethod === "razorpay" ? razorpay : undefined,
    orderStatus: "placed",
    trackingHistory: [{ status: "placed", note: "Order placed successfully" }],
    notes: notes || "",
  });

  // Decrement stock (best-effort, non-blocking)
  Promise.all(
    items.map((it) =>
      Product.findByIdAndUpdate(it.product, {
        $inc: { stockQuantity: -it.quantity },
      }),
    ),
  ).catch(() => {});

  // Clear the cart
  cart.items = [];
  await cart.save();

  // Generate invoice + send confirmation email (non-blocking, don't fail the order on error)
  generateInvoicePDF(order, req.user)
    .then((url) => Order.findByIdAndUpdate(order._id, { invoiceUrl: url }))
    .catch((err) => console.error("Invoice generation failed:", err.message));
  sendOrderConfirmationEmail(req.user, order).catch(() => {});

  res.status(201).json({ success: true, data: order });
});

// @desc    Get my orders
// @route   GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ success: true, data: orders });
});

// @desc    Get one of my orders by id (for tracking / details)
// @route   GET /api/orders/mine/:id
export const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  res.json({ success: true, data: order });
});

// ---------- Admin ----------

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;

  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.max(parseInt(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  });
});

// @desc    Get single order (admin)
// @route   GET /api/orders/:id
// @access  Private (Admin)
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email phone",
  );
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  res.json({ success: true, data: order });
});
// @desc    Cancel my order
// @route   PATCH /api/orders/:id/cancel
// @access  Private (User)
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (!["placed", "confirmed"].includes(order.orderStatus)) {
    res.status(400);
    throw new Error("This order can no longer be cancelled.");
  }

  order.orderStatus = "cancelled";

  order.trackingHistory.push({
    status: "cancelled",
    note: "Order cancelled by customer",
  });

  await order.save();

  res.json({
    success: true,
    message: "Order cancelled successfully",
    data: order,
  });
});
// @desc    Update order status / tracking (admin)
// @route   PATCH /api/orders/:id
// @access  Private (Admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, trackingNumber, note } = req.body;
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email",
  );
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (orderStatus) {
    order.orderStatus = orderStatus;
    order.trackingHistory.push({ status: orderStatus, note: note || "" });
  }
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;

  await order.save();

  sendOrderStatusEmail(order.user, order).catch(() => {});

  res.json({ success: true, data: order });
});

// @desc    Permanently delete an order (admin) — only allowed once cancelled
// @route   DELETE /api/orders/:id
// @access  Private (Admin)
export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.orderStatus !== "cancelled") {
    res.status(400);
    throw new Error("Only cancelled orders can be permanently deleted");
  }

  await order.deleteOne();

  res.json({ success: true, message: "Order permanently deleted" });
});
