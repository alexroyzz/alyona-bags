import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import Loader from "../../components/Loader.jsx";
import ReviewPhotoGallery from "../../components/ReviewPhotoGallery.jsx";

const ReviewRow = ({ review, onStatus, onPublication, onEditName, onDelete }) => {
  // A review is public only when approved and not unpublished. Anything else is hidden, and its photos are hidden with it.
  const live = review.status === "approved" && review.isPublished !== false;
  return (
    <article className="card-surface min-w-0 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${live ? "bg-forest-700/10 text-forest-700" : "bg-stone-200 text-ink-900/60"}`}>{live ? "Live" : "Hidden"}</span>
            {review.verifiedPurchase && <span className="rounded-full bg-forest-700/10 px-2.5 py-1 text-[11px] text-forest-700">Verified purchase</span>}
          </div>
          <h2 className="mt-3 break-words font-display text-xl text-ink-900">{review.title}</h2>
          <p className="mt-1 text-sm text-ink-900/60">{review.authorName}{review.product?.name ? ` · ${review.product.name}` : " · General review"} · {new Date(review.createdAt).toLocaleDateString()}</p>
        </div>
        <p className="shrink-0 text-lg tracking-[0.12em] text-brass-500" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
      </div>
      <p className="mt-4 whitespace-pre-line break-words text-sm leading-6 text-ink-900/75">{review.comment}</p>
      <ReviewPhotoGallery images={review.images} reviewerName={review.authorName} />
      <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
        {live
          ? <button type="button" onClick={() => onPublication(review, false)} className="min-h-10 rounded-full border border-red-200 px-4 text-xs font-medium text-red-700 hover:bg-red-50">Hide</button>
          : <button type="button" onClick={() => onStatus(review, "approved")} className="btn-primary min-h-10 !px-4 !py-2 text-xs">Restore</button>}
        <button type="button" onClick={() => onEditName(review)} className="btn-secondary min-h-10 !px-4 !py-2 text-xs">Edit display name</button>
        <button type="button" onClick={() => onDelete(review)} className="ml-auto min-h-10 rounded-full px-4 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
      </div>
    </article>
  );
};

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = async () => {
    setLoading(true);
    try {
      const reviewsResponse = await api.get("/admin/reviews", { params: { status: status || undefined, search: search || undefined, page, limit: 20 } });
      setReviews(reviewsResponse.data.data || []);
      setPagination(reviewsResponse.data.pagination || { pages: 0, total: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load reviews.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [status, search, page]);

  const updateStatus = async (review, nextStatus) => {
    try {
      await api.patch(`/admin/reviews/${review._id}/status`, { status: nextStatus });
      toast.success(nextStatus === "approved" ? "Review restored and visible on the Reviews page." : "Review hidden.");
      load();
    } catch (error) { toast.error(error.response?.data?.message || "Could not update review."); }
  };

  const updatePublication = async (review, isPublished) => {
    try {
      await api.patch(`/admin/reviews/${review._id}/publication`, { isPublished });
      toast.success(isPublished ? "Review restored and visible on the Reviews page." : "Review hidden from the public site.");
      load();
    } catch (error) { toast.error(error.response?.data?.message || "Could not update publication."); }
  };

  const editName = async (review) => {
    const authorName = window.prompt("Customer display name", review.authorName);
    if (authorName === null || authorName.trim() === review.authorName) return;
    try {
      await api.patch(`/admin/reviews/${review._id}/display`, { authorName });
      toast.success("Display name updated.");
      load();
    } catch (error) { toast.error(error.response?.data?.message || "Could not update display name."); }
  };

  const deleteReview = async (review) => {
    if (!window.confirm("Permanently delete this review and its uploaded photos? The customer will be able to submit a new review for this item.")) return;
    try {
      await api.delete(`/admin/reviews/${review._id}`);
      toast.success("Review deleted.");
      load();
    } catch (error) { toast.error(error.response?.data?.message || "Could not delete review."); }
  };

  const statusOptions = [
    ["", "All reviews"], ["published", "Live"], ["hidden", "Hidden"],
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Customer feedback</p><h1 className="mt-2 font-display text-3xl text-ink-900">Reviews Management</h1><p className="mt-2 text-sm text-ink-900/55">Customer reviews go live as soon as they are submitted. Hide a review to remove it, and its photos, from the public site, or restore it later. Customers cannot replace a hidden review with a new one.</p></div>
        <p className="text-sm text-ink-900/50">{pagination.total} reviews</p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="sr-only" htmlFor="review-search">Search reviewer or product</label>
        <input id="review-search" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by reviewer or product" className="min-h-12 rounded-lg border border-stone-200 bg-white px-4 text-base" />
        <label className="sr-only" htmlFor="review-status">Filter reviews</label>
        <select id="review-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="min-h-12 rounded-lg border border-stone-200 bg-white px-4 text-sm">
          {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {loading ? <div className="mt-8"><Loader /></div> : reviews.length ? (
        <div className="mt-5 grid gap-4">
          {reviews.map((review) => <ReviewRow key={review._id} review={review} onStatus={updateStatus} onPublication={updatePublication} onEditName={editName} onDelete={deleteReview} />)}
        </div>
      ) : <p className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white/60 px-5 py-10 text-center text-sm text-ink-900/55">No reviews match these filters.</p>}
      {pagination.pages > 1 && <nav className="mt-7 flex items-center justify-center gap-4" aria-label="Admin review pages"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="btn-secondary min-h-10 !px-4 disabled:opacity-40">Previous</button><span className="text-sm text-ink-900/60">Page {page} of {pagination.pages}</span><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)} className="btn-secondary min-h-10 !px-4 disabled:opacity-40">Next</button></nav>}
    </AdminLayout>
  );
}
