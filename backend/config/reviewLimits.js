// Single source of truth for review photo limits. The frontend reads maxPhotos from
// GET /api/reviews/mine, so changing REVIEW_MAX_PHOTOS here keeps both sides consistent.
// Capped at 8 because the shared upload middleware accepts at most 8 files per request.
const requested = Number.parseInt(process.env.REVIEW_MAX_PHOTOS, 10);
export const MAX_REVIEW_PHOTOS = Number.isInteger(requested) ? Math.min(8, Math.max(1, requested)) : 5;
export const MAX_REVIEW_PHOTO_MB = 5; // matches the fileSize limit in middleware/upload.js
