import asyncHandler from "express-async-handler";
import Enquiry from "../models/Enquiry.js";
import Product from "../models/Product.js";

// @desc    Create enquiry (Request a Quote / Contact form)
// @route   POST /api/enquiries
// @access  Public
export const createEnquiry = asyncHandler(async (req, res) => {
  const { name, phone, email, message, product } = req.body;

  if (!name || !phone) {
    res.status(400);
    throw new Error("Name and phone number are required");
  }

  let productName = "";
  if (product) {
    const prod = await Product.findById(product);
    if (prod) productName = prod.name;
  }

  const enquiry = await Enquiry.create({ name, phone, email, message, product: product || null, productName });
  res.status(201).json({ success: true, data: enquiry });
});

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private (Admin)
export const getEnquiries = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.max(parseInt(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  const [enquiries, total] = await Promise.all([
    Enquiry.find(filter).populate("product", "name slug").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Enquiry.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: enquiries,
    pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
  });
});

// @desc    Update enquiry status
// @route   PATCH /api/enquiries/:id
// @access  Private (Admin)
export const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }
  const { status } = req.body;
  if (!["new", "contacted", "closed"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status value");
  }
  enquiry.status = status;
  await enquiry.save();
  res.json({ success: true, data: enquiry });
});

// @desc    Delete enquiry
// @route   DELETE /api/enquiries/:id
// @access  Private (Admin)
export const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }
  await enquiry.deleteOne();
  res.json({ success: true, message: "Enquiry deleted" });
});

// @desc    Dashboard stats
// @route   GET /api/enquiries/stats/dashboard
// @access  Private (Admin)
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalProducts, totalCategories, totalEnquiries, recentEnquiries, newEnquiries] = await Promise.all([
    Product.countDocuments(),
    (await import("../models/Category.js")).default.countDocuments(),
    Enquiry.countDocuments(),
    Enquiry.find().sort({ createdAt: -1 }).limit(5).populate("product", "name"),
    Enquiry.countDocuments({ status: "new" }),
  ]);

  res.json({
    success: true,
    data: { totalProducts, totalCategories, totalEnquiries, newEnquiries, recentEnquiries },
  });
});
