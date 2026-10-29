import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import { MAX_REVIEW_PHOTOS as MAX_PHOTOS, MAX_REVIEW_PHOTO_MB } from "../config/reviewLimits.js";

const publishedReviewFilter = { status: "approved", $or: [{ isPublished: true }, { isPublished: { $exists: false } }] };
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cleanText = (value) => typeof value === "string"
  ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim()
  : "";

const removeUploadedFiles = async (files = []) => {
  await Promise.allSettled(files.filter((file) => file?.filename || file?.publicId).map((file) =>
    cloudinary.uploader.destroy(file.filename || file.publicId, { resource_type: "image", invalidate: true }),
  ));
};

const findProduct = (slug) => {
  const choices = [{ slug }, { legacySlugs: slug }];
  if (mongoose.isValidObjectId(slug)) choices.push({ _id: slug });
  return Product.findOne({ $or: choices, isActive: true }).select("_id name slug");
};

const pagination = (query, defaultLimit = 12, maxLimit = 48) => {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.min(requestedPage, 1000000)) : 1;
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, maxLimit)) : defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
};

const photoLimitMessage = `A review can include up to ${MAX_PHOTOS} photo${MAX_PHOTOS === 1 ? "" : "s"}.`;
const scalar = (value) => (typeof value === "string" || typeof value === "number" ? value : "");
const usableImages = (images = []) => (images || []).filter((image) => typeof image?.url === "string" && /^https?:\/\//i.test(image.url));

// Only a delivered, non-failed/refunded order that contains this product makes a review "verified".
const findVerifiedOrder = (userId, productId) => Order.findOne({
  user: userId,
  orderStatus: "delivered",
  paymentStatus: { $nin: ["failed", "refunded"] },
  "items.product": productId,
}).sort({ createdAt: -1 }).select("_id").lean();

const parseReviewFields = (body, fallbackName) => {
  const ratingInput = scalar(body.rating);
  const rating = ratingInput === "" ? NaN : Number(ratingInput);
  const title = cleanText(scalar(body.title));
  const comment = cleanText(scalar(body.comment));
  const authorName = cleanText(scalar(body.authorName)) || cleanText(fallbackName);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Choose a rating from 1 to 5." };
  if (title.length < 2 || title.length > 100) return { error: "Review titles must be between 2 and 100 characters." };
  if (comment.length < 5 || comment.length > 1500) return { error: "Review text must be between 5 and 1500 characters." };
  if (!authorName || authorName.length > 120) return { error: "A display name of up to 120 characters is required." };
  return { rating, title, comment, authorName };
};

const uploadsAreUsable = (files) => files.every((file) => typeof file?.path === "string" && file.path && file.filename);

const createReview = async (req, res, productFromRoute = null) => {
  const files = req.files || [];
  const reject = async (status, message, extra = {}) => {
    await removeUploadedFiles(files);
    return res.status(status).json({ success: false, message, ...extra });
  };

  let product = productFromRoute;
  try {
    const fields = parseReviewFields(req.body, req.user?.name);
    if (fields.error) return reject(400, fields.error);
    if (files.length > MAX_PHOTOS) return reject(400, photoLimitMessage);
    if (!uploadsAreUsable(files)) return reject(502, "A photo could not be uploaded. Please try again.");

    const productIdInput = scalar(req.body.productId);
    if (!product && productIdInput !== "") {
      if (typeof productIdInput !== "string" || !mongoose.isValidObjectId(productIdInput)) return reject(400, "Choose a valid product or submit a general review.");
      product = await Product.findOne({ _id: productIdInput, isActive: true }).select("_id name slug");
      if (!product) return reject(404, "The selected product is not available.");
    }

    // The signed-in user comes from the verified JWT (req.user); user ids in the body are ignored.
    const existing = await Review.findOne({ product: product?._id || null, user: req.user._id }).select("_id").lean();
    if (existing) return reject(409, product
      ? "You have already reviewed this product. Open Write a Review and choose it again to edit your review."
      : "You have already submitted a store review. Open Write a Review and choose General customer review to edit it.", { existingReviewId: existing._id });

    const verifiedOrder = product ? await findVerifiedOrder(req.user._id, product._id) : null;

    const review = await Review.create({
      product: product?._id || null,
      user: req.user._id,
      order: verifiedOrder?._id || null,
      authorName: fields.authorName,
      rating: fields.rating,
      title: fields.title,
      comment: fields.comment,
      images: files.map((file) => ({ url: file.path, publicId: file.filename })),
      verifiedPurchase: Boolean(verifiedOrder),
      status: "approved",
      isPublished: true,
    });
    return res.status(201).json({
      success: true,
      message: "Thank you! Your review is now live.",
      data: { id: review._id, status: review.status, isPublished: review.isPublished },
    });
  } catch (error) {
    // The unique (product, user) index is the final guard against concurrent duplicates.
    if (error?.code === 11000) {
      const existing = await Review.findOne({ product: product?._id || null, user: req.user._id }).select("_id").lean().catch(() => null);
      return reject(409, "You have already reviewed this item. Choose it again in Write a Review to edit your review.", existing ? { existingReviewId: existing._id } : {});
    }
    await removeUploadedFiles(files);
    throw error;
  }
};

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate("product", "name slug")
    .select("product authorName rating title comment images verifiedPurchase status isPublished createdAt updatedAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.set("Cache-Control", "private, no-store");
  res.json({
    success: true,
    limits: { maxPhotos: MAX_PHOTOS, maxPhotoMb: MAX_REVIEW_PHOTO_MB },
    data: reviews.map((review) => ({
      ...review,
      images: usableImages(review.images),
      isLive: review.status === "approved" && review.isPublished !== false,
    })),
  });
});

// Owners can edit their own review (never create a second one). Editing never changes
// moderation state, so a review an admin hid stays hidden until an admin restores it.
export const updateOwnReview = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const reject = async (status, message) => {
    await removeUploadedFiles(files);
    return res.status(status).json({ success: false, message });
  };
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) return reject(404, "Review not found.");
    const fields = parseReviewFields(req.body, review.authorName);
    if (fields.error) return reject(400, fields.error);
    if (!uploadsAreUsable(files)) return reject(502, "A photo could not be uploaded. Please try again.");

    const rawRemovals = [].concat(req.body.removeImages ?? []);
    if (rawRemovals.some((id) => typeof id !== "string")) return reject(400, "Invalid photo selection.");
    const removals = new Set(rawRemovals);
    const kept = (review.images || []).filter((image) => !removals.has(image.publicId));
    const removed = (review.images || []).filter((image) => removals.has(image.publicId));
    if (kept.length + files.length > MAX_PHOTOS) return reject(400, photoLimitMessage);

    const verifiedOrder = review.product ? await findVerifiedOrder(req.user._id, review.product) : null;
    review.set({
      authorName: fields.authorName,
      rating: fields.rating,
      title: fields.title,
      comment: fields.comment,
      images: [...kept.map((image) => ({ url: image.url, publicId: image.publicId })), ...files.map((file) => ({ url: file.path, publicId: file.filename }))],
      order: verifiedOrder?._id || null,
      verifiedPurchase: Boolean(verifiedOrder),
    });
    await review.save();
    await removeUploadedFiles(removed);
    const live = review.status === "approved" && review.isPublished !== false;
    res.json({
      success: true,
      message: live ? "Your review was updated." : "Your review was updated. It is currently hidden by our team and is not shown publicly.",
      data: { id: review._id, status: review.status, isPublished: review.isPublished, isLive: live },
    });
  } catch (error) {
    await removeUploadedFiles(files);
    throw error;
  }
});

export const getProductRatingSummary = async (productId) => {
  const [row] = await Review.aggregate([
    { $match: { ...publishedReviewFilter, product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } },
  ]);
  return { count: row?.count || 0, averageRating: row?.average ? Number(row.average.toFixed(1)) : 0 };
};

export const getPublicReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = { ...publishedReviewFilter };
  if (req.query.scope === "product") filter.product = { $ne: null };
  if (req.query.scope === "store") filter.product = null;
  const rating = Number.parseInt(req.query.rating, 10);
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) filter.rating = rating;
  const sort = {
    highest: { rating: -1, createdAt: -1, _id: -1 },
    lowest: { rating: 1, createdAt: -1, _id: -1 },
    pictures: { "images.0": -1, createdAt: -1, _id: -1 },
  }[req.query.sort] || { createdAt: -1, _id: -1 };
  const [reviews, total, summaryRows, photoReviews] = await Promise.all([
    Review.find(filter)
      .select("product authorName rating title comment images verifiedPurchase createdAt")
      .populate("product", "name slug images")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: publishedReviewFilter },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        withPhotos: { $sum: { $cond: [{ $gt: [{ $size: { $filter: { input: { $ifNull: ["$images", []] }, as: "image", cond: { $gt: [{ $strLenCP: { $ifNull: ["$$image.url", ""] } }, 0] } } } }, 0] }, 1, 0] } },
        productReviews: { $sum: { $cond: [{ $ne: [{ $ifNull: ["$product", null] }, null] }, 1, 0] } },
        storeReviews: { $sum: { $cond: [{ $eq: [{ $ifNull: ["$product", null] }, null] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        twoStar: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        threeStar: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
      } },
    ]),
    // Newest published reviews that have photos, independent of the tab/rating filters, so the
    // Customer Photos strip always matches the "reviews with photos" count.
    Review.find({ ...publishedReviewFilter, "images.0": { $exists: true } })
      .select("product authorName rating title comment images verifiedPurchase createdAt")
      .populate("product", "name slug images")
      .sort({ createdAt: -1, _id: -1 })
      .limit(8)
      .lean(),
  ]);
  const summaryRow = summaryRows[0] || {};
  const summary = {
    total: summaryRow.total || 0,
    averageRating: summaryRow.averageRating ? Number(summaryRow.averageRating.toFixed(1)) : 0,
    withPhotos: summaryRow.withPhotos || 0,
    productReviews: summaryRow.productReviews || 0,
    storeReviews: summaryRow.storeReviews || 0,
    ratingCounts: {
      1: summaryRow.oneStar || 0,
      2: summaryRow.twoStar || 0,
      3: summaryRow.threeStar || 0,
      4: summaryRow.fourStar || 0,
      5: summaryRow.fiveStar || 0,
    },
  };
  const data = reviews.map((review) => {
    const withImages = { ...review, images: usableImages(review.images) };
    return review.product
      ? { ...withImages, product: { ...review.product, images: (review.product.images || []).slice(0, 1) } }
      : withImages;
  });
  const photoData = photoReviews
    .map((review) => ({
      ...review,
      images: usableImages(review.images),
      product: review.product ? { ...review.product, images: (review.product.images || []).slice(0, 1) } : null,
    }))
    .filter((review) => review.images.length > 0);
  res.set("Cache-Control", "no-store");
  res.json({ success: true, data, summary, photoReviews: photoData, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const product = await findProduct(req.params.slug);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const [found, summary] = await Promise.all([
    Review.find({ ...publishedReviewFilter, product: product._id })
      .select("authorName rating title comment images verifiedPurchase createdAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    getProductRatingSummary(product._id),
  ]);
  const reviews = found.map((review) => ({ ...review, images: usableImages(review.images) }));

  res.set("Cache-Control", "no-store");
  res.json({ success: true, data: { reviews, count: summary.count, averageRating: summary.averageRating } });
});

export const createReviewForCatalog = asyncHandler(async (req, res) => createReview(req, res));

export const createProductReview = asyncHandler(async (req, res) => {
  const product = await findProduct(req.params.slug);
  if (!product) {
    await removeUploadedFiles(req.files || []);
    res.status(404);
    throw new Error("Product not found");
  }
  await createReview(req, res, product);
});

export const getAdminReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 20, 100);
  const filter = {};
  const requestedStatus = String(req.query.status || "");
  if (["pending", "approved", "rejected"].includes(requestedStatus)) filter.status = requestedStatus;
  else if (requestedStatus === "published") {
    filter.status = "approved";
    filter.$and = [{ $or: [{ isPublished: true }, { isPublished: { $exists: false } }] }];
  }
  else if (requestedStatus === "hidden") {
    filter.$and = [{ $or: [{ status: { $ne: "approved" } }, { isPublished: false }] }];
  }
  else if (requestedStatus === "unpublished") {
    filter.status = { $in: ["pending", "approved"] };
    filter.isPublished = { $ne: true };
  }

  const search = cleanText(String(req.query.search || "")).slice(0, 100);
  if (search) {
    const expression = new RegExp(escapeRegex(search), "i");
    const products = await Product.find({ name: expression }).select("_id").lean();
    const searchFilter = { $or: [{ authorName: expression }, { product: { $in: products.map((item) => item._id) } }] };
    filter.$and = [...(filter.$and || []), searchFilter];
  }
  const [reviews, total] = await Promise.all([
    Review.find(filter).populate("product", "name slug")
      .select("product user authorName rating title comment images verifiedPurchase order status isPublished createdAt updatedAt")
      .sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, data: reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Choose approved or rejected as the moderation status.");
  }
  // Approving restores the review to the public site; rejecting hides it. Both keep the review
  // record, so the one-review-per-product rule keeps applying to the owner.
  const update = { status, isPublished: status === "approved" };
  const review = await Review.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true })
    .populate("product", "name slug");
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }
  res.json({ success: true, data: review });
});

export const updateReviewPublication = asyncHandler(async (req, res) => {
  if (![true, false, "true", "false"].includes(req.body.isPublished)) {
    res.status(400);
    throw new Error("Publication state must be true or false.");
  }
  const isPublished = req.body.isPublished === true || req.body.isPublished === "true";
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }
  if (isPublished && review.status !== "approved") {
    res.status(409);
    throw new Error("Only approved reviews can be published.");
  }
  review.isPublished = isPublished;
  await review.save();
  res.json({ success: true, data: review });
});

export const updateReviewDisplayName = asyncHandler(async (req, res) => {
  const authorName = cleanText(req.body.authorName);
  if (!authorName || authorName.length > 120) {
    res.status(400);
    throw new Error("Display name must be between 1 and 120 characters.");
  }
  const review = await Review.findByIdAndUpdate(req.params.id, { $set: { authorName } }, { new: true, runValidators: true })
    .populate("product", "name slug");
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }
  res.json({ success: true, data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }
  await review.deleteOne();
  await removeUploadedFiles(review.images || []);
  res.json({ success: true, message: "Review deleted." });
});
