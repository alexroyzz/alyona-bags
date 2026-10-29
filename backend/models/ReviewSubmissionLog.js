import mongoose from "mongoose";

// One short-lived row per review submission, used to enforce the per-account hourly limit.
// MongoDB removes rows automatically through the TTL index (no cleanup job required).
export const REVIEW_LOG_TTL_SECONDS = 60 * 60;

const reviewSubmissionLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now, expires: REVIEW_LOG_TTL_SECONDS },
}, { versionKey: false });

reviewSubmissionLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("ReviewSubmissionLog", reviewSubmissionLogSchema);
