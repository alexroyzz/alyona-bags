import mongoose from "mongoose";

const reviewImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  authorName: { type: String, required: true, trim: true, maxlength: 120 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  comment: { type: String, required: true, trim: true, maxlength: 1500 },
  images: { type: [reviewImageSchema], default: [], validate: [(images) => images.length <= 5, "A review can include up to five photos"] },
  // Set only by the backend from a matching delivered order; never read from request bodies.
  verifiedPurchase: { type: Boolean, default: false },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  isPublished: { type: Boolean, default: false, index: true },
}, { timestamps: true });

// One review per user per product; store reviews have product = null, so this also
// enforces one store review per user. It covers hidden/rejected reviews as well, so
// hiding a review can never be used to submit a replacement.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, isPublished: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
