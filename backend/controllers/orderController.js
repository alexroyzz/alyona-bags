import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { generateOrderNumber } from "../utils/generateOrderNumber.js";
import { getWholesaleOnlyCheckoutMessage } from "../utils/onlinePayment.js";
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
  const { shippingAddress, paymentMethod, razorpay, notes } = req.body;

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

  // A signed Razorpay response means checkout began while this product was
  // eligible. Honor that in-flight payment if an admin changes the setting
  // while the customer is completing the gateway flow. COD and unverified
  // requests must still obey the current product payment setting.
  const isRazorpayPayment = paymentMethod === "razorpay";
  let verifiedRazorpayPayment = false;
  const hasRazorpayDetails =
    Boolean(razorpay?.orderId) &&
    Boolean(razorpay?.paymentId) &&
    Boolean(razorpay?.signature);
  if (isRazorpayPayment && hasRazorpayDetails) {
    verifiedRazorpayPayment = verifyRazorpaySignature(razorpay);
    if (!verifiedRazorpayPayment) {
      res.status(400);
      throw new Error("Payment verification failed — signature mismatch");
    }
  }

  const restrictionMessage = getWholesaleOnlyCheckoutMessage(cart.items);
  if (restrictionMessage && !verifiedRazorpayPayment) {
    res.status(409);
    throw new Error(restrictionMessage);
  }
  if (isRazorpayPayment && !hasRazorpayDetails) {
    res.status(400);
    throw new Error("Payment verification details are missing");
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

  const total = Math.round(subtotal + SHIPPING_FEE);

  // Payment verification for Razorpay orders
  const paymentStatus = isRazorpayPayment ? "paid" : "pending";

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user._id,
    items,
    shippingAddress,
    subtotal: Math.round(subtotal),
    shippingFee: SHIPPING_FEE,
    total,
    paymentMethod: paymentMethod || "razorpay",
    paymentStatus,
    razorpay: isRazorpayPayment ? razorpay : undefined,
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

  const requestedPage = Number.parseInt(page, 10);
  const requestedLimit = Number.parseInt(limit, 10);
  const pageNum = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), 1000000)
    : 1;
  const limitNum = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 20;
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
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
