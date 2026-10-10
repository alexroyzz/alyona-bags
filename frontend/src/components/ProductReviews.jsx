import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import userApi from "../api/userAxios.js";
import { useUserAuth } from "../context/UserAuthContext.jsx";

export default function ProductReviews({ slug }) {
  const { isAuthenticated } = useUserAuth();
  const [data, setData] = useState({ reviews: [], count: 0, averageRating: 0 });
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const response = await api.get(`/products/${encodeURIComponent(slug)}/reviews`);
      setData(response.data.data);
    } catch {
      setData({ reviews: [], count: 0, averageRating: 0 });
    }
  }, [slug]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await userApi.post(`/products/${encodeURIComponent(slug)}/reviews`, { rating, title, comment });
      toast.success("Thanks for sharing your verified purchase review.");
      setTitle("");
      setComment("");
      await loadReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit your review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container-px py-16 border-t border-stone-200" aria-labelledby="reviews-title">
      <div className="max-w-4xl mx-auto">
        <span className="eyebrow">Verified buyers</span>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h2 id="reviews-title" className="font-display text-3xl text-ink-900">Customer Reviews</h2>
          <p className="text-sm text-ink-900/60" aria-live="polite">
            {data.count ? `${data.averageRating} out of 5 · ${data.count} verified ${data.count === 1 ? "review" : "reviews"}` : "No reviews yet"}
          </p>
        </div>

        {data.reviews.length > 0 && (
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {data.reviews.map((review) => (
              <article key={review._id} className="card-surface p-5">
                <p className="text-brass-500" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                <h3 className="mt-2 font-semibold text-ink-900">{review.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-900/70">{review.comment}</p>
                <p className="mt-4 text-xs text-ink-900/50">{review.authorName} · Verified purchase · {new Date(review.createdAt).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 max-w-xl">
          <h3 className="font-display text-xl text-ink-900">Share your experience</h3>
          {isAuthenticated ? (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <label className="block text-sm text-ink-900/70">Rating
                <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-stone-200 bg-white px-3 py-2" aria-label="Rating from 1 to 5">
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} out of 5</option>)}
                </select>
              </label>
              <label className="block text-sm text-ink-900/70">Review title
                <input required minLength={2} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2" />
              </label>
              <label className="block text-sm text-ink-900/70">Your review
                <textarea required minLength={5} maxLength={1500} rows={4} value={comment} onChange={(event) => setComment(event.target.value)} className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2" />
              </label>
              <p className="text-xs text-ink-900/50">Reviews are accepted only for delivered purchases on your account.</p>
              <button className="btn-primary" disabled={submitting}>{submitting ? "Submitting…" : "Submit Review"}</button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-ink-900/60"><Link to="/login" className="text-forest-700 underline">Sign in</Link> to review a product you have received.</p>
          )}
        </div>
      </div>
    </section>
  );
}
