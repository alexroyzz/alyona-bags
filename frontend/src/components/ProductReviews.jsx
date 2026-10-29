import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import userApi from "../api/userAxios.js";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import ReviewPhotoGallery from "./ReviewPhotoGallery.jsx";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function ProductReviews({ slug, onSummaryChange }) {
  const { isAuthenticated, user } = useUserAuth();
  const [data, setData] = useState({ reviews: [], count: 0, averageRating: 0 });
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      const response = await api.get(`/products/${encodeURIComponent(slug)}/reviews`);
      const nextData = response.data.data;
      setData(nextData);
      onSummaryChange?.(nextData.count > 0 ? { ratingValue: nextData.averageRating, reviewCount: nextData.count } : null);
    } catch {
      setData({ reviews: [], count: 0, averageRating: 0 });
      onSummaryChange?.(null);
    }
  }, [slug, onSummaryChange]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const form = new FormData();
      form.append("rating", String(rating));
      form.append("title", title.trim());
      form.append("comment", comment.trim());
      form.append("authorName", user?.name || "");
      photos.forEach((photo) => form.append("images", photo));
      await userApi.post(`/products/${encodeURIComponent(slug)}/reviews`, form);
      toast.success("Thank you. Your review is waiting for moderation.");
      setTitle("");
      setComment("");
      setRating(5);
      setPhotos([]);
    } catch (error) {
      const message = error.response?.data?.message || "Could not submit your review.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onPhotoChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (selected.length > 5) return setFormError("Choose up to five photos.");
    if (selected.some((file) => !acceptedTypes.has(file.type))) return setFormError("Photos must be JPG, PNG or WebP images.");
    if (selected.some((file) => file.size > 5 * 1024 * 1024)) return setFormError("Each photo must be 5 MB or smaller.");
    setFormError("");
    setPhotos(selected);
  };

  return (
    <section className="mt-14 border-t border-stone-200 pt-10 sm:mt-20 sm:pt-14" aria-labelledby="reviews-title">
      <div className="mx-auto max-w-4xl">
        <span className="eyebrow">Customer feedback</span>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h2 id="reviews-title" className="font-display text-2xl text-ink-900 sm:text-3xl">Customer Reviews</h2>
          <p className="text-sm text-ink-900/60" aria-live="polite">{data.count ? `${data.averageRating} out of 5 · ${data.count} ${data.count === 1 ? "review" : "reviews"}` : "No reviews yet"}</p>
        </div>

        {data.reviews.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-stone-200 bg-white/60 px-5 py-8 text-center">
            <p className="text-sm text-ink-900/70">No reviews yet for this product.</p>
            <p className="mt-1 text-xs text-ink-900/50">Share your experience, whether or not you purchased through our website.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.reviews.map((review) => (
              <article key={review._id} className="card-surface min-w-0 p-4 sm:p-5">
                <p className="text-brass-500" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                <h3 className="mt-2 break-words font-semibold text-ink-900">{review.title}</h3>
                <p className="mt-2 break-words text-sm leading-6 text-ink-900/70">{review.comment}</p>
                <p className="mt-4 text-xs text-ink-900/50">{review.authorName}{review.verifiedPurchase ? " · Verified purchase" : ""} · {new Date(review.createdAt).toLocaleDateString()}</p>
                <ReviewPhotoGallery images={review.images} reviewerName={review.authorName} />
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 max-w-xl min-w-0">
          <h3 className="font-display text-xl text-ink-900">Share your experience</h3>
          {isAuthenticated ? (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <label className="block text-sm text-ink-900/70">Rating
                <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-1 block w-full min-h-12 rounded-lg border border-stone-200 bg-white px-3 py-3 text-base" aria-label="Rating from 1 to 5">
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} out of 5</option>)}
                </select>
              </label>
              <label className="block text-sm text-ink-900/70">Review title
                <input required minLength={2} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 block w-full min-h-12 rounded-lg border border-stone-200 bg-white px-3 py-3 text-base" />
              </label>
              <label className="block text-sm text-ink-900/70">Your review
                <textarea required minLength={5} maxLength={1500} rows={4} value={comment} onChange={(event) => setComment(event.target.value)} className="mt-1 block w-full rounded-lg border border-stone-200 bg-white px-3 py-3 text-base" />
              </label>
              <label className="block text-sm text-ink-900/70">Photos <span className="text-ink-900/40">(optional, up to 5)</span>
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={onPhotoChange} className="mt-2 block w-full max-w-full text-sm text-ink-900/70 file:mr-3 file:rounded-full file:border-0 file:bg-forest-700 file:px-4 file:py-2.5 file:text-xs file:font-medium file:text-stone-50" />
              </label>
              {photos.length > 0 && <p className="text-xs text-ink-900/50">{photos.length} photo{photos.length === 1 ? "" : "s"} selected.</p>}
              {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
              <p className="text-xs text-ink-900/50">Reviews are checked by our team before they appear publicly.</p>
              <button className="btn-primary min-h-[48px] w-full sm:w-auto" disabled={submitting}>{submitting ? "Submitting…" : "Submit Review"}</button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-ink-900/60"><Link to="/login" state={{ from: `/products/${slug}` }} className="text-forest-700 underline">Sign in</Link> to submit a review. A purchase is not required.</p>
          )}
        </div>
      </div>
    </section>
  );
}
