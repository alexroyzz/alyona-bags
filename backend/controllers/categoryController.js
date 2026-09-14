import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { cloudinary } from "../config/cloudinary.js";

// @desc    Get all categories (public: only active)
// @route   GET /api/categories
export const getCategories = asyncHandler(async (req, res) => {
  const filter = req.admin ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ name: 1 });
  res.json({ success: true, data: categories });
});

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({ success: true, data: category });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin)
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;

  const image = req.file
    ? { url: req.file.path, publicId: req.file.filename }
    : { url: "", publicId: "" };

  const category = await Category.create({ name, description, isActive, image });
  res.status(201).json({ success: true, data: category });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const { name, description, isActive } = req.body;
  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive === "true" || isActive === true;

  if (req.file) {
    if (category.image?.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId).catch(() => {});
    }
    category.image = { url: req.file.path, publicId: req.file.filename };
  }

  await category.save();
  res.json({ success: true, data: category });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    res.status(400);
    throw new Error(
      `Cannot delete: ${productCount} product(s) are assigned to this category. Reassign or delete them first.`
    );
  }

  if (category.image?.publicId) {
    await cloudinary.uploader.destroy(category.image.publicId).catch(() => {});
  }

  await category.deleteOne();
  res.json({ success: true, message: "Category deleted" });
});
