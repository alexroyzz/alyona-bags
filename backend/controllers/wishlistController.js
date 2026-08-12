import asyncHandler from "express-async-handler";
import Wishlist from "../models/Wishlist.js";

const populateWishlist = (query) =>
  query.populate({
    path: "products",
    select: "name slug images price discountPrice stockStatus moq",
  });

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await populateWishlist(Wishlist.findOne({ user: req.user._id }));
  if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  res.json({ success: true, data: wishlist });
});

// @desc    Toggle a product in the wishlist (add if absent, remove if present)
// @route   POST /api/wishlist/toggle
export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });

  const exists = wishlist.products.some((p) => p.toString() === productId);
  if (exists) {
    wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
  } else {
    wishlist.products.push(productId);
  }

  await wishlist.save();
  const populated = await populateWishlist(Wishlist.findById(wishlist._id));
  res.json({ success: true, data: populated, added: !exists });
});
