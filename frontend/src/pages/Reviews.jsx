import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import Seo from "../components/Seo.jsx";
import { PhotoLightbox, usableImages } from "../components/ReviewPhotoGallery.jsx";
import ReviewSubmissionModal from "../components/ReviewSubmissionModal.jsx";
import { cloudinaryImageUrl, cloudinarySrcSet } from "../utils/cloudinaryImage.js";

const PAGE_SIZE = 8;
const EMPTY_SUMMARY = { total: 0, averageRating: 0, withPhotos: 0, productReviews: 0, storeReviews: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

const Stars = ({ rating, size = "text-sm" }) => (
  <span className={`whitespace-nowrap tracking-[0.12em] text-brass-500 ${size}`} aria-label={`${rating} out of 5 stars`}>
    {"★".repeat(Math.max(0, Math.min(5, rating)))}{"☆".repeat(Math.max(0, 5 - rating))}
  </span>
);

const COMMENT_PREVIEW_LENGTH = 150;

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(-1);
  const [brokenPhotos, setBrokenPhotos] = useState(() => new Set());
  const authorName = review.authorName || "Customer";
  const productImage = review.product?.images?.[0]?.url;
  const photos = usableImages(review.images);
  const comment = review.comment || "";
  const isLong = comment.length > COMMENT_PREVIEW_LENGTH;
  const markBroken = (url) => setBrokenPhotos((current) => new Set(current).add(url));
  const heroPhoto = photos.find((photo) => !brokenPhotos.has(photo.url));

  return (
    <article id={`review-${review._id}`} className="card-surface flex min-w-0 scroll-mt-28 flex-col overflow-hidden">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden border-b border-stone-200/60 bg-stone-100">
        {heroPhoto ? (
          <button type="button" onClick={() => setPhotoIndex(photos.indexOf(heroPhoto))} className="block h-full w-full" aria-label={`Open ${authorName}'s customer photo`}>
            <img
              src={cloudinaryImageUrl(heroPhoto.url, 640)}
              srcSet={cloudinarySrcSet(heroPhoto.url, [320, 480, 640])}
              sizes="(min-width: 1100px) 22vw, (min-width: 640px) 44vw, 92vw"
              alt={`${authorName}'s customer photo`}
              loading="lazy"
              decoding="async"
              onError={() => markBroken(heroPhoto.url)}
              className="h-full w-full object-contain"
            />
          </button>
        ) : productImage ? (
          <img
            src={cloudinaryImageUrl(productImage, 480)}
            srcSet={cloudinarySrcSet(productImage, [320, 480, 640])}
            sizes="(min-width: 1100px) 22vw, (min-width: 640px) 44vw, 92vw"
            alt={review.product?.name || "Reviewed product"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-center" aria-hidden="true">
            <span className="font-display text-sm tracking-[0.2em] text-brass-500/70">ALYONA BAGS</span>
          </div>
        )}
        {heroPhoto && photos.length > 1 && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5" role="group" aria-label={`${authorName}'s review photos`}>
            {photos.slice(0, 5).map((photo, index) => (
              <button type="button" key={photo.publicId || photo.url} onClick={() => setPhotoIndex(index)} className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/80 bg-stone-100 shadow" aria-label={`Open customer photo ${index + 1} of ${photos.length}`}>
                <img src={cloudinaryImageUrl(photo.url, 96)} alt="" loading="lazy" decoding="async" className="h-full w-full bg-white object-contain" />
              </button>
            ))}
            <span className="ml-auto rounded-full bg-ink-900/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">📷 {photos.length}</span>
          </div>
        )}
        <PhotoLightbox images={photos} index={photoIndex} onIndexChange={setPhotoIndex} onClose={() => setPhotoIndex(-1)} reviewerName={authorName} review={review} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Stars rating={review.rating} size="text-sm" />
          <span className="sr-only">{review.rating} out of 5</span>
        </div>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="min-w-0 break-words text-sm font-medium text-ink-900">{authorName}</p>
          {review.verifiedPurchase === true && <span className="inline-flex items-center gap-1 rounded-full border border-forest-700/20 bg-forest-700/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-forest-700"><span aria-hidden="true">✓</span> Verified</span>}
        </div>
        <h2 className="mt-2 break-words font-display text-lg leading-snug text-ink-900">{review.title}</h2>
        <p className={`mt-2 whitespace-pre-line break-words text-sm leading-6 text-ink-900/70 ${isLong && !expanded ? "line-clamp-4" : ""}`}>{comment}</p>
        {isLong && <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="mt-1.5 self-start text-xs font-medium text-forest-700 hover:underline">{expanded ? "Show less" : "Read more"}</button>}
        {review.product?.name && <p className="mt-3 break-words text-xs text-ink-900/45">Product: <Link className="break-words font-medium text-forest-700 hover:underline" to={`/products/${encodeURIComponent(review.product.slug)}`}>{review.product.name}</Link></p>}
      </div>
    </article>
  );
}

export default function Reviews() {
  const { isAuthenticated, user } = useUserAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [photoReviews, setPhotoReviews] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [scope, setScope] = useState("all");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const requestSequence = useRef(0);
  const loadMoreInFlight = useRef(false);

  const query = useMemo(() => ({
    limit: PAGE_SIZE,
    ...(scope === "all" ? {} : { scope }),
    ...(rating ? { rating } : {}),
    sort,
  }), [rating, scope, sort]);

  const loadReviews = useCallback(async (pageToLoad = 1, { append = false, signal } = {}) => {
    const requestId = ++requestSequence.current;
    if (append) {
      loadMoreInFlight.current = true;
      setLoadingMore(true);
    } else {
      loadMoreInFlight.current = false;
      setLoading(true);
      setLoadingMore(false);
      setLoadError(false);
    }

    try {
      const response = await api.get("/reviews", { params: { ...query, page: pageToLoad }, signal });
      if (requestId !== requestSequence.current || signal?.aborted) return;
      const incoming = response.data.data || [];
      setReviews((current) => append ? [...current, ...incoming] : incoming);
      setPagination(response.data.pagination || { page: pageToLoad, pages: 0, total: 0 });
      setSummary(response.data.summary || EMPTY_SUMMARY);
      if (!append) setPhotoReviews(response.data.photoReviews || []);
      setLoadError(false);
    } catch (error) {
      if (requestId !== requestSequence.current || signal?.aborted || error.code === "ERR_CANCELED") return;
      if (!append) setReviews([]);
      setLoadError(true);
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setLoadingMore(false);
        loadMoreInFlight.current = false;
      }
    }
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    loadReviews(1, { signal: controller.signal });
    return () => {
      controller.abort();
      requestSequence.current += 1;
    };
  }, [loadReviews]);
  useEffect(() => {
    api.get("/products", { params: { page: 1, limit: 48 } })
      .then((response) => setProducts(response.data?.data || []))
      .catch(() => setProducts([]));
  }, []);

  const changeFilter = (setter, value) => {
    requestSequence.current += 1;
    loadMoreInFlight.current = false;
    setter(value);
    setReviews([]);
    setLoading(true);
    setLoadingMore(false);
    setLoadError(false);
  };
  const clearFilters = () => {
    requestSequence.current += 1;
    loadMoreInFlight.current = false;
    setScope("all");
    setRating("");
    setSort("newest");
    setReviews([]);
    setLoading(true);
    setLoadingMore(false);
    setLoadError(false);
  };
  const loadMoreReviews = () => {
    if (loadMoreInFlight.current || loadingMore || loading) return;
    const nextPage = (pagination.page || 1) + 1;
    if (nextPage > pagination.pages) return;
    loadReviews(nextPage, { append: true });
  };
  const openSubmission = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/reviews" } });
      return;
    }
    setModalOpen(true);
  };
  const photos = photoReviews.flatMap((review) => usableImages(review.images).map((image, index) => ({ review, image, index }))).slice(0, 12);

  return (
    <div className="pb-28 pt-28 sm:pb-20 sm:pt-32">
      <Seo title="Customer Reviews | Alyona Bags" description="Read customer reviews of Alyona Bags products and share your own experience with our bags." path="/reviews" />

      <section className="container-px" aria-labelledby="reviews-heading">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Customer stories</p>
          <h1 id="reviews-heading" className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">Customer reviews</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-900/60 sm:text-base">Thoughtful notes and real-life moments shared by the Alyona Bags community.</p>

          <div className="mt-7 grid gap-6 rounded-xl2 border border-stone-200/80 bg-white p-5 shadow-card sm:p-7 md:grid-cols-[minmax(0,1fr)_minmax(230px,0.8fr)_auto] md:items-center md:gap-8 lg:p-9">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-center">
                <p className="font-display text-5xl leading-none text-ink-900 sm:text-6xl">{summary.total ? summary.averageRating.toFixed(1) : "—"}</p>
                <div className="mt-2"><Stars rating={Math.round(summary.averageRating)} size="text-base" /></div>
                <p className="mt-2 text-xs text-ink-900/50">{summary.total} {summary.total === 1 ? "review" : "reviews"}</p>
              </div>
              <div className="min-w-0 flex-1" aria-label="Ratings distribution">
                {[5, 4, 3, 2, 1].map((value) => {
                  const count = summary.ratingCounts?.[value] || 0;
                  const percent = summary.total ? Math.round((count / summary.total) * 100) : 0;
                  return <div key={value} className="flex items-center gap-2 py-0.5 text-xs text-ink-900/50"><span className="w-3 text-right">{value}</span><span aria-hidden="true" className="text-brass-500">★</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100"><span className="block h-full rounded-full bg-brass-500" style={{ width: `${percent}%` }} /></span><span className="w-5 text-right">{count}</span></div>;
                })}
              </div>
            </div>
            <div className="border-y border-stone-100 py-4 text-sm text-ink-900/60 md:border-y-0 md:border-l md:py-0 md:pl-7">
              <p className="font-medium text-ink-900">A note from our customers</p>
              <p className="mt-1.5 leading-6">Every published review is shared by a customer. Purchase verification appears only when a delivered order is matched.</p>
            </div>
            <button type="button" onClick={openSubmission} className="btn-primary min-h-12 w-full whitespace-nowrap md:w-auto">Write a Review</button>
          </div>

          {photos.length > 0 && (
            <div id="customer-photos" className="mt-7 scroll-mt-28" role="region" aria-label="Customer review photos">
              <div className="mb-3 flex items-baseline justify-between gap-3"><h2 className="font-display text-xl text-ink-900">Customer photos</h2><span className="text-xs text-ink-900/45">{summary.withPhotos} {summary.withPhotos === 1 ? "review" : "reviews"} with photos</span></div>
              <div className="flex touch-scroll-x gap-3 overflow-x-auto pb-2 no-scrollbar">
                {photos.map(({ review, image, index }) => {
                  const name = review.authorName || "Customer";
                  return <button type="button" key={`${review._id}-${image.publicId || image.url}`} onClick={() => setLightbox({ images: usableImages(review.images), index, name, review })} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-card sm:h-24 sm:w-24" aria-label={`Open ${name}'s review photo ${index + 1}`}><img src={cloudinaryImageUrl(image.url, 192)} alt={`${name}'s customer photo`} loading="lazy" decoding="async" className="h-full w-full object-contain" /></button>;
                })}
              </div>
              {lightbox && <PhotoLightbox images={lightbox.images} index={lightbox.index} onIndexChange={(index) => setLightbox((current) => ({ ...current, index }))} onClose={() => setLightbox(null)} reviewerName={lightbox.name} review={lightbox.review} />}
            </div>
          )}
        </div>
      </section>

      <section className="container-px mt-9 sm:mt-12" aria-label="Published customer reviews">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 touch-scroll-x flex gap-5 overflow-x-auto" role="tablist" aria-label="Review type">
              {[{ id: "all", label: `All reviews (${summary.total})` }, { id: "product", label: `Product reviews (${summary.productReviews})` }, { id: "store", label: `Store reviews (${summary.storeReviews})` }].map((tab) => <button type="button" role="tab" aria-selected={scope === tab.id} key={tab.id} onClick={() => changeFilter(setScope, tab.id)} className={`min-h-11 shrink-0 border-b-2 px-0.5 text-sm font-medium transition-colors ${scope === tab.id ? "border-forest-700 text-forest-700" : "border-transparent text-ink-900/50 hover:text-ink-900"}`}>{tab.label}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <label className="sr-only" htmlFor="review-rating-filter">Filter by rating</label>
              <select id="review-rating-filter" value={rating} onChange={(event) => changeFilter(setRating, event.target.value)} className="min-h-11 min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-forest-700"><option value="">All ratings</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select>
              <label className="sr-only" htmlFor="review-sort">Sort reviews</label>
              <select id="review-sort" value={sort} onChange={(event) => changeFilter(setSort, event.target.value)} className="min-h-11 min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-forest-700"><option value="newest">Most recent</option><option value="pictures">Pictures first</option><option value="highest">Highest rating</option><option value="lowest">Lowest rating</option></select>
            </div>
          </div>

          {loading ? (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 min-[1100px]:grid-cols-4" aria-label="Loading reviews" aria-live="polite">{[0, 1, 2, 3].map((item) => <div key={item} className="card-surface h-[26rem] animate-pulse bg-white" />)}</div>
          ) : loadError && !reviews.length ? (
            <div role="alert" className="mx-auto mt-5 max-w-4xl rounded-xl2 border border-stone-200 bg-white px-6 py-12 text-center"><p className="font-display text-2xl text-ink-900">Reviews are unavailable right now</p><p className="mt-2 text-sm text-ink-900/55">Please try again in a little while.</p><button type="button" onClick={() => loadReviews(1)} className="btn-secondary mt-5 min-h-11 !px-5">Try again</button></div>
          ) : reviews.length ? (
            <ul className="mt-5 grid list-none grid-cols-1 items-start gap-5 p-0 sm:grid-cols-2 min-[1100px]:grid-cols-4" aria-label="Customer reviews">
              {reviews.map((review) => <li key={review._id} className="min-w-0"><ReviewCard review={review} /></li>)}
            </ul>
          ) : (
            <div className="mx-auto mt-5 max-w-4xl rounded-xl2 border border-dashed border-stone-300 bg-white/70 px-6 py-14 text-center"><p className="font-display text-2xl text-ink-900">{summary.total ? "No reviews match these filters" : "No reviews yet"}</p><p className="mt-2 text-sm text-ink-900/55">{summary.total ? "Try another rating or review type." : "Be the first to share your experience with Alyona Bags."}</p>{summary.total > 0 && <button type="button" className="btn-secondary mt-5 min-h-11 !px-5" onClick={clearFilters}>Clear filters</button>}</div>
          )}

          {loadError && reviews.length > 0 && <p role="status" className="mt-5 text-center text-sm text-red-700">Could not load more reviews. <button type="button" className="underline" onClick={loadMoreReviews}>Try again</button></p>}
          {!loading && pagination.page < pagination.pages && <div className="mt-8 text-center"><button type="button" onClick={loadMoreReviews} disabled={loadingMore} className="btn-secondary min-h-12 min-w-44 disabled:opacity-50">{loadingMore ? "Loading…" : "Load more reviews"}</button><p className="mt-2 text-xs text-ink-900/45">Showing {reviews.length} of {pagination.total}</p></div>}
        </div>
      </section>

      {modalOpen && <ReviewSubmissionModal products={products} user={user} onClose={() => setModalOpen(false)} onSubmitted={() => loadReviews(1)} />}
    </div>
  );
}
