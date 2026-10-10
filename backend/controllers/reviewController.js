import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";

const findProduct = (slug) => {
  const choices = [{ slug }, { legacySlugs: slug }];
  if (mongoose.isValidObjectId(slug)) choices.push({ _id: slug });
  return Product.findOne({ $or: choices, isActive: true }).select("_id");
};

export const getProductReviews = asyncHandler(async (req, res) => {
  const product = await findProduct(req.params.slug);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const reviews = await Review.find({ product: product._id, status: "approved" })
    .select("authorName rating title comment verifiedPurchase createdAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const averageRating = reviews.length
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
    : 0;

  res.json({ success: true, data: { reviews, count: reviews.length, averageRating } });
});

export const createProductReview = asyncHandler(async (req, res) => {
  const product = await findProduct(req.params.slug);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const order = await Order.findOne({
    user: req.user._id,
    orderStatus: "delivered",
    "items.product": product._id,
  }).select("_id");
  if (!order) {
    res.status(403);
    throw new Error("A review is available after this product has been delivered to your account.");
  }

  const duplicate = await Review.exists({ product: product._id, user: req.user._id });
  if (duplicate) {
    res.status(409);
    throw new Error("You have already reviewed this product for this order.");
  }

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    order: order._id,
    authorName: req.user.name,
    rating: req.body.rating,
    title: req.body.title,
    comment: req.body.comment,
  });
  res.status(201).json({ success: true, data: review });
});
