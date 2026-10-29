import { rateLimit } from "express-rate-limit";
import ReviewSubmissionLog from "../models/ReviewSubmissionLog.js";
import { createRateLimitHandler } from "./authRateLimiters.js";

const WINDOW_MS = 60 * 60 * 1000;
export const REVIEW_ACCOUNT_LIMIT = Number(process.env.REVIEW_ACCOUNT_LIMIT_PER_HOUR) || 3;
// Deliberately generous: many customers can share one office/mobile-carrier IP. This only
// stops one network from flooding uploads; the strict limit is the per-account one below.
const REVIEW_IP_LIMIT = Number(process.env.REVIEW_IP_LIMIT_PER_HOUR) || 30;

export const reviewIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: REVIEW_IP_LIMIT,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: createRateLimitHandler("Too many review submissions from this network.", WINDOW_MS),
});

const inFlightUsers = new Set();

const formatWait = (seconds) => seconds < 60
  ? `${seconds} second${seconds === 1 ? "" : "s"}`
  : `${Math.ceil(seconds / 60)} minute${seconds > 60 ? "s" : ""}`;

// Must run after protectUser (identity comes from the verified JWT, never the request body)
// and BEFORE the multer upload, so rejected requests never reach Cloudinary.
// - Allows one submission per account at a time (repeated clicks / concurrent requests).
// - Allows REVIEW_ACCOUNT_LIMIT successful submissions or edits per rolling hour. Requests
//   that fail validation do not use up the allowance.
export const reviewSubmissionGuard = async (req, res, next) => {
  const userId = String(req.user._id);
  if (inFlightUsers.has(userId)) {
    return res.status(409).json({ success: false, message: "Your previous review is still being saved. Please wait a moment." });
  }
  inFlightUsers.add(userId);

  let slot = null;
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    inFlightUsers.delete(userId);
    const succeeded = res.writableEnded && res.statusCode >= 200 && res.statusCode < 300;
    if (slot && !succeeded) ReviewSubmissionLog.deleteOne({ _id: slot._id }).catch(() => {});
  };
  res.once("finish", cleanup);
  res.once("close", cleanup);

  try {
    slot = await ReviewSubmissionLog.create({ user: req.user._id });
    const since = new Date(Date.now() - WINDOW_MS);
    const used = await ReviewSubmissionLog.countDocuments({ user: req.user._id, createdAt: { $gte: since } });
    if (used > REVIEW_ACCOUNT_LIMIT) {
      const oldest = await ReviewSubmissionLog.findOne({ user: req.user._id, createdAt: { $gte: since } }).sort({ createdAt: 1 }).lean();
      await ReviewSubmissionLog.deleteOne({ _id: slot._id });
      slot = null;
      const retryAfterSeconds = Math.max(1, Math.ceil(((oldest?.createdAt?.getTime() || Date.now()) + WINDOW_MS - Date.now()) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: `You can submit or edit up to ${REVIEW_ACCOUNT_LIMIT} reviews per hour. Please try again in ${formatWait(retryAfterSeconds)}.`,
        retryAfterSeconds,
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
