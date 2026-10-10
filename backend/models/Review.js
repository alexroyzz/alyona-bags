import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  authorName: { type: String, required: true, trim: true, maxlength: 120 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  comment: { type: String, required: true, trim: true, maxlength: 1500 },
  verifiedPurchase: { type: Boolean, default: true, immutable: true },
  status: { type: String, enum: ["approved"], default: "approved" },
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
