import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const populateCart = (query) =>
  query.populate({
    path: "items.product",
    select: "name slug images price discountPrice stockQuantity moq isActive",
  });

// @desc    Get current user's cart
// @route   GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  let cart = await populateCart(Cart.findOne({ user: req.user._id }));
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  res.json({ success: true, data: cart });
});

// @desc    Add item to cart (or increase quantity if it already exists)
// @route   POST /api/cart
export const addToCart = asyncHandler(async (req, res) => {
  const {
    productId,
    quantity = 1,
    color = "",
    printingType = "plain",
    logo = {},
    instructions = "",
  } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error("Product not found");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existing = cart.items.find(
    (i) =>
      i.product.toString() === productId &&
      i.color === color &&
      i.printingType === printingType,
  );
  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({
      product: productId,
      quantity: Number(quantity),
      color,
      printingType,
      logo: logo || {},
      instructions,
    });
  }

  await cart.save();
  const populated = await populateCart(Cart.findById(cart._id));
  res.status(201).json({ success: true, data: populated });
});

// @desc    Update quantity of a cart item
// @route   PUT /api/cart/:itemId
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }
  const item = cart.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error("Cart item not found");
  }
  if (quantity <= 0) {
    item.deleteOne();
  } else {
    item.quantity = quantity;
  }
  await cart.save();
  const populated = await populateCart(Cart.findById(cart._id));
  res.json({ success: true, data: populated });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }
  cart.items = cart.items.filter((i) => i._id.toString() !== req.params.itemId);
  await cart.save();
  const populated = await populateCart(Cart.findById(cart._id));
  res.json({ success: true, data: populated });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [] },
    { upsert: true },
  );
  res.json({ success: true, message: "Cart cleared" });
});
