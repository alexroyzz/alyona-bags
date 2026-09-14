import asyncHandler from "express-async-handler";
import Coupon from "../models/Coupon.js";

// @desc    Validate a coupon code against a cart subtotal (storefront)
// @route   POST /api/coupons/validate
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;

  const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });
  if (!coupon) {
    res.status(404);
    throw new Error("Invalid coupon code");
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400);
    throw new Error("This coupon has expired");
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error("This coupon has reached its usage limit");
  }
  if (subtotal < coupon.minOrderValue) {
    res.status(400);
    throw new Error(`Minimum order value for this coupon is Rs. ${coupon.minOrderValue}`);
  }

  let discount =
    coupon.discountType === "percentage" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;

  if (coupon.discountType === "percentage" && coupon.maxDiscountAmount > 0) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }
  discount = Math.min(discount, subtotal);

  res.json({ success: true, data: { code: coupon.code, discount: Math.round(discount) } });
});

// @desc    List all coupons
// @route   GET /api/coupons
// @access  Private (Admin)
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, data: coupons });
});

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Private (Admin)
export const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, minOrderValue, maxDiscountAmount, expiresAt, usageLimit, isActive } =
    req.body;

  const coupon = await Coupon.create({
    code: code?.toUpperCase(),
    discountType,
    discountValue,
    minOrderValue,
    maxDiscountAmount,
    expiresAt: expiresAt || null,
    usageLimit,
    isActive,
  });
  res.status(201).json({ success: true, data: coupon });
});

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private (Admin)
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  const fields = ["discountType", "discountValue", "minOrderValue", "maxDiscountAmount", "expiresAt", "usageLimit", "isActive"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) coupon[f] = req.body[f];
  });
  if (req.body.code) coupon.code = req.body.code.toUpperCase();
  await coupon.save();
  res.json({ success: true, data: coupon });
});

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin)
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  await coupon.deleteOne();
  res.json({ success: true, message: "Coupon deleted" });
});
