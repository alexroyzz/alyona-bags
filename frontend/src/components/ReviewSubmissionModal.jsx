import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineX } from "react-icons/hi";
import toast from "react-hot-toast";
import userApi from "../api/userAxios.js";
import useDialogAccessibility from "../hooks/useDialogAccessibility.js";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const inputClass = "mt-1 block w-full min-h-11 rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-base text-ink-900 outline-none focus:border-forest-700";
const steps = ["Rating", "Review details", "Your details"];

const DEFAULT_MAX_PHOTOS = 5; // replaced by the limit the server reports (GET /reviews/mine)
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;
const STORE_KEY = "store";

export default function ReviewSubmissionModal({ products = [], user, onClose, onSubmitted }) {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(5);
  const [productId, setProductId] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState(user?.name || "");
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myReviews, setMyReviews] = useState(new Map());
  const [loadedReviewId, setLoadedReviewId] = useState("");
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [maxPhotos, setMaxPhotos] = useState(DEFAULT_MAX_PHOTOS);
  const submittingRef = useRef(false);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previews = useMemo(() => photos.map((file) => ({ file, url: URL.createObjectURL(file) })), [photos]);

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);

  // The server is the source of truth for "already reviewed": load this user's reviews so the
  // form can switch to edit mode instead of trying to create a duplicate.
  const loadMyReviews = async () => {
    try {
      const response = await userApi.get("/reviews/mine");
      const map = new Map();
      (response.data?.data || []).forEach((review) => map.set(review.product?._id || STORE_KEY, review));
      setMyReviews(map);
      if (Number.isInteger(response.data?.limits?.maxPhotos)) setMaxPhotos(response.data.limits.maxPhotos);
      return map;
    } catch {
      return null;
    }
  };
  useEffect(() => { loadMyReviews(); }, []);

  const existingReview = myReviews.get(productId || STORE_KEY) || null;
  useEffect(() => {
    if ((existingReview?._id || "") === loadedReviewId) return;
    setLoadedReviewId(existingReview?._id || "");
    setPhotos([]);
    setRemovedPhotoIds([]);
    if (existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title || "");
      setComment(existingReview.comment || "");
      setAuthorName(existingReview.authorName || user?.name || "");
      setExistingPhotos(existingReview.images || []);
      setNotice(existingReview.isLive === false
        ? "You already reviewed this. You can edit it, but it is currently hidden by our team and stays hidden until restored."
        : "You already reviewed this, so you are editing your existing review.");
    } else {
      setTitle("");
      setComment("");
      setExistingPhotos([]);
      setNotice("");
    }
  }, [existingReview, loadedReviewId, user?.name]);
  const keptPhotos = existingPhotos.filter((photo) => !removedPhotoIds.includes(photo.publicId));
  const photoSlotsLeft = Math.max(0, maxPhotos - keptPhotos.length - photos.length);
  useDialogAccessibility({
    open: true,
    dialogRef,
    initialFocusRef: closeButtonRef,
    onClose,
    closeDisabled: submitting,
  });

  // Adds to the current selection (so photos can be added in several rounds) and keeps every valid file that fits.
  const selectPhotos = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;
    const known = new Set(photos.map(fileKey));
    const fresh = selected.filter((file) => !known.has(fileKey(file)));
    const valid = fresh.filter((file) => allowedTypes.has(file.type) && file.size <= MAX_PHOTO_BYTES);
    const accepted = valid.slice(0, photoSlotsLeft);
    if (accepted.length) setPhotos((current) => [...current, ...accepted]);
    if (fresh.some((file) => !allowedTypes.has(file.type))) setError("Photos must be JPG, PNG or WebP images.");
    else if (fresh.some((file) => file.size > MAX_PHOTO_BYTES)) setError("Each photo must be 5 MB or smaller.");
    else if (valid.length > accepted.length) setError(`Only ${maxPhotos} photos can be added to a review. Extra photos were skipped.`);
    else setError("");
  };
  const removeNewPhoto = (key) => setPhotos((current) => current.filter((file) => fileKey(file) !== key));

  const nextStep = () => {
    setError("");
    if (step === 1 && (title.trim().length < 2 || comment.trim().length < 5)) {
      setError("Add a title and a few words about your experience.");
      return;
    }
    if (step === 2 && (!authorName.trim() || authorName.trim().length > 120)) {
      setError("Enter a display name of up to 120 characters.");
      return;
    }
    setStep((current) => Math.min(2, current + 1));
  };

  const submit = async () => {
    if (submittingRef.current) return; // ignore repeated clicks before React re-renders
    if (!authorName.trim() || authorName.trim().length > 120) {
      setError("Enter a display name of up to 120 characters.");
      return;
    }
    if (title.trim().length < 2 || comment.trim().length < 5) {
      setError("Add a title and a few words about your experience.");
      setStep(1);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("rating", String(rating));
      form.append("title", title.trim());
      form.append("comment", comment.trim());
      form.append("authorName", authorName.trim());
      photos.forEach((photo) => form.append("images", photo));
      if (existingReview) {
        removedPhotoIds.forEach((id) => form.append("removeImages", id));
        const response = await userApi.put(`/reviews/${existingReview._id}`, form);
        toast.success(response.data?.message || "Your review was updated.");
      } else {
        if (productId) form.append("productId", productId);
        const response = await userApi.post("/reviews", form);
        toast.success(response.data?.message || "Thank you! Your review is now live.");
      }
      onSubmitted?.();
      onClose();
    } catch (requestError) {
      const data = requestError.response?.data;
      const message = data?.message || "Your review could not be submitted. Please check your connection and try again.";
      setError(message);
      if (requestError.response?.status === 409 && data?.existingReviewId) {
        // Already reviewed (for example from another tab): reload so the form switches to edit mode.
        setLoadedReviewId("");
        await loadMyReviews();
        setStep(1);
      }
      toast.error(message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-ink-900/65 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="review-modal-title" className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl2 bg-stone-50 shadow-2xl sm:max-h-[min(94dvh,780px)]">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-200 px-4 py-3 sm:px-7 sm:py-4">
          <div>
            <p className="eyebrow">Share your experience</p>
            <h2 id="review-modal-title" className="mt-0.5 font-display text-xl text-ink-900 sm:text-2xl">{existingReview ? "Edit your review" : "Write a Review"}</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} disabled={submitting} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl text-ink-900/60 hover:bg-stone-200 disabled:opacity-40" aria-label="Close review form"><HiOutlineX /></button>
        </header>

        <div className="shrink-0 border-b border-stone-200 px-4 py-2.5 sm:px-7 sm:py-3">
          <ol className="grid grid-cols-3 gap-2" aria-label="Review submission steps">
            {steps.map((label, index) => (
              <li key={label} className="min-w-0">
                <div className={`h-1.5 rounded-full ${index <= step ? "bg-forest-700" : "bg-stone-200"}`} />
                <p className={`mt-1.5 truncate text-[11px] font-medium sm:text-xs ${index === step ? "text-forest-700" : "text-ink-900/45"}`}>{index + 1}. {label}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-7 sm:py-5">
          {step === 0 && (
            <div>
              <h3 className="font-display text-xl text-ink-900">How would you rate your experience?</h3>
              <p className="mt-2 text-sm text-ink-900/55">Your review appears on the Reviews page as soon as you submit it.</p>
              <div className="mt-6 flex items-center gap-1" role="group" aria-label="Choose a rating from one to five">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`} aria-pressed={rating === value} className={`min-h-12 min-w-12 text-3xl transition-colors ${value <= rating ? "text-brass-500" : "text-stone-300"}`}>★</button>
                ))}
                <span className="ml-3 text-sm text-ink-900/55">{rating} out of 5</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-6">
              <div className="grid content-start gap-3">
                <h3 className="font-display text-lg text-ink-900 sm:text-xl">Tell us about it</h3>
                <label className="block text-sm text-ink-900/70">Product <span className="text-ink-900/40">(optional)</span>
                  <select value={productId} onChange={(event) => setProductId(event.target.value)} disabled={submitting} className={inputClass}>
                    <option value="">{myReviews.has(STORE_KEY) ? "General customer review (reviewed)" : "General customer review"}</option>
                    {products.filter((product) => product.isActive !== false).map((product) => <option key={product._id} value={product._id}>{product.name}{myReviews.has(product._id) ? " (reviewed)" : ""}</option>)}
                  </select>
                </label>
                {notice && <p role="status" className="rounded-lg bg-brass-500/10 px-3 py-2 text-xs text-ink-900/75 sm:text-sm">{notice}</p>}
                <label className="block text-sm text-ink-900/70">Review title
                  <input value={title} onChange={(event) => setTitle(event.target.value)} minLength={2} maxLength={100} required className={inputClass} />
                </label>
                <label className="block text-sm text-ink-900/70">Your review
                  <textarea value={comment} onChange={(event) => setComment(event.target.value)} minLength={5} maxLength={1500} required rows={4} className={`${inputClass} resize-none`} />
                </label>
              </div>

              <section aria-labelledby="review-photos-heading" className="content-start rounded-xl border border-stone-200 bg-white p-3 sm:p-4 md:mt-8">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 id="review-photos-heading" className="text-sm font-medium text-ink-900">Photos <span className="font-normal text-ink-900/40">(optional)</span></h4>
                  <span className="text-xs text-ink-900/50" aria-live="polite">{keptPhotos.length + photos.length} of {maxPhotos}</span>
                </div>
                <ul className="mt-2.5 grid list-none grid-cols-4 gap-2 p-0 sm:grid-cols-5 md:grid-cols-3">
                  {existingPhotos.map((photo) => {
                    const removed = removedPhotoIds.includes(photo.publicId);
                    return (
                      <li key={photo.publicId || photo.url} className="relative aspect-square">
                        <img src={photo.url} alt="Your current review photo" className={`h-full w-full rounded-lg border border-stone-200 object-cover ${removed ? "opacity-30" : ""}`} />
                        <button type="button" disabled={submitting || (removed && photoSlotsLeft <= 0)} onClick={() => setRemovedPhotoIds((current) => removed ? current.filter((id) => id !== photo.publicId) : [...current, photo.publicId])} className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink-900 text-xs text-white shadow disabled:opacity-40" aria-label={removed ? "Keep this photo" : "Remove this photo"}>{removed ? "↺" : "×"}</button>
                      </li>
                    );
                  })}
                  {previews.map(({ file, url }) => (
                    <li key={fileKey(file)} className="relative aspect-square">
                      <img src={url} alt={`Selected ${file.name}`} className="h-full w-full rounded-lg border border-stone-200 object-cover" />
                      <button type="button" disabled={submitting} onClick={() => removeNewPhoto(fileKey(file))} className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink-900 text-xs text-white shadow disabled:opacity-40" aria-label={`Remove ${file.name}`}>×</button>
                    </li>
                  ))}
                  {photoSlotsLeft > 0 && (
                    <li className="aspect-square">
                      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-forest-700/40 bg-forest-700/5 text-center text-forest-700 focus-within:ring-2 focus-within:ring-forest-700 hover:bg-forest-700/10">
                        <span className="text-xl leading-none" aria-hidden="true">+</span>
                        <span className="text-[11px] font-medium leading-tight">Add photos</span>
                        <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={selectPhotos} disabled={submitting} className="sr-only" />
                      </label>
                    </li>
                  )}
                </ul>
                <p className="mt-2 text-xs text-ink-900/45">Select several at once or add more later. JPG, PNG or WebP · up to {maxPhotos} photos · 5 MB each</p>
              </section>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <h3 className="font-display text-xl text-ink-900">How should your name appear?</h3>
              <p className="text-sm leading-relaxed text-ink-900/55">We use the display name on your Alyona Bags account by default. You can change how it appears with this review.</p>
              <label className="block text-sm text-ink-900/70">Customer display name
                <input value={authorName} onChange={(event) => setAuthorName(event.target.value)} maxLength={120} required className={inputClass} />
              </label>
              <div className="rounded-lg border border-stone-200 bg-white p-4">
                <p className="text-xs uppercase tracking-widest text-ink-900/40">Review preview</p>
                <p className="mt-3 text-brass-500" aria-label={`${rating} out of 5 stars`}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</p>
                <p className="mt-2 font-semibold text-ink-900">{title || "Your review title"}</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink-900/65">{comment || "Your review text"}</p>
                <p className="mt-3 text-xs text-ink-900/45">{authorName || "Customer name"}{productId ? ` · ${products.find((item) => item._id === productId)?.name || "Product review"}` : " · Store review"}</p>
              </div>
              <p className="text-xs leading-relaxed text-ink-900/45">You can review without a purchase. Your review is published right away, and you can edit it later by choosing the same product again. The Verified badge appears only for delivered orders.</p>
            </div>
          )}
        </div>

        {error && <p role="alert" className="shrink-0 border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700 sm:px-7">{error}</p>}

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-stone-200 bg-white px-4 py-3 sm:px-7 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => { setError(""); setStep((current) => Math.max(0, current - 1)); }} disabled={step === 0 || submitting} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink-900/65 hover:bg-stone-100 disabled:opacity-35"><HiOutlineArrowLeft /> Back</button>
          {step < 2 ? (
            <button type="button" onClick={nextStep} className="btn-primary min-h-11 !px-5">Continue <HiOutlineArrowRight /></button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting} className="btn-primary min-h-11 !px-5 disabled:opacity-50">{submitting ? "Saving…" : existingReview ? "Save changes" : "Submit review"}</button>
          )}
        </footer>
      </section>
    </div>
  );
}
