import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import { cloudinary } from "../config/cloudinary.js";

// @desc    Get all products (public: active only, with search/filter/pagination)
// @route   GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, featured, page = 1, limit = 12 } = req.query;

  const filter = req.admin ? {} : { isActive: true };

  if (category) filter.category = category;
  if (featured === "true") filter.isFeatured = true;
  if (search) filter.$text = { $search: search };

  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.max(parseInt(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: products,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  });
});

// @desc    Get single product by slug
// @route   GET /api/products/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate(
    "category",
    "name slug",
  );
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ success: true, data: product });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin)
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    moq,
    material,
    colors,
    description,
    features,
    stockStatus,
    isFeatured,
    isActive,
    price,
    discountPrice,
    sku,
    stockQuantity,

    allowCustomPrint,
  } = req.body;

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("At least one product image is required");
  }

  const images = req.files.map((file) => ({
    url: file.path,
    publicId: file.filename,
  }));

  const product = await Product.create({
    name,
    category,
    moq,
    material,
    colors: parseListField(colors),
    description,
    features: parseListField(features),
    stockStatus,
    isFeatured: isFeatured === "true" || isFeatured === true,
    isActive:
      isActive === undefined ? true : isActive === "true" || isActive === true,
    images,
    price: price !== undefined ? Number(price) : 0,
    discountPrice: discountPrice !== undefined ? Number(discountPrice) : 0,
    sku: sku || "",
    stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 100,
    allowCustomPrint: allowCustomPrint === "true" || allowCustomPrint === true,
  });

  res.status(201).json({ success: true, data: product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const {
    name,
    category,
    moq,
    material,
    colors,
    description,
    features,
    stockStatus,
    isFeatured,
    isActive,
    price,
    discountPrice,
    sku,
    stockQuantity,
    removeImageIds,
    allowCustomPrint,
  } = req.body;
  if (allowCustomPrint !== undefined) {
    product.allowCustomPrint =
      allowCustomPrint === "true" || allowCustomPrint === true;
  }
  if (name) product.name = name;
  if (category) product.category = category;
  if (moq) product.moq = moq;
  if (material) product.material = material;
  if (colors !== undefined) product.colors = parseListField(colors);
  if (description) product.description = description;
  if (features !== undefined) product.features = parseListField(features);
  if (stockStatus) product.stockStatus = stockStatus;
  if (isFeatured !== undefined)
    product.isFeatured = isFeatured === "true" || isFeatured === true;
  if (isActive !== undefined)
    product.isActive = isActive === "true" || isActive === true;
  if (price !== undefined && price !== "") product.price = Number(price);
  if (discountPrice !== undefined && discountPrice !== "")
    product.discountPrice = Number(discountPrice);
  if (sku !== undefined) product.sku = sku;
  if (stockQuantity !== undefined && stockQuantity !== "")
    product.stockQuantity = Number(stockQuantity);

  // Remove selected images
  if (removeImageIds) {
    const idsToRemove = JSON.parse(removeImageIds);
    for (const publicId of idsToRemove) {
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
    product.images = product.images.filter(
      (img) => !idsToRemove.includes(img.publicId),
    );
  }

  // Add new images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));
    product.images.push(...newImages);
  }

  if (product.images.length === 0) {
    res.status(400);
    throw new Error("Product must have at least one image");
  }

  await product.save();
  res.json({ success: true, data: product });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  for (const img of product.images) {
    await cloudinary.uploader.destroy(img.publicId).catch(() => {});
  }

  await product.deleteOne();
  res.json({ success: true, message: "Product deleted" });
});

function parseListField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
}
