import { useEffect, useRef, useState } from "react";
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineX } from "react-icons/hi";
import { Link } from "react-router-dom";
import useDialogAccessibility from "../hooks/useDialogAccessibility.js";

// Only images with a real URL are shown; everything else is treated as "no photo".
export const usableImages = (images = []) => (Array.isArray(images) ? images : []).filter((image) => typeof image?.url === "string" && image.url.trim());

// Full-size photo viewer shared by review cards, the Customer Photos strip and the admin list.
// Pass `review` to also show that review's details beside the photo (two-panel layout).
export function PhotoLightbox({ images = [], index, onIndexChange, onClose, reviewerName = "Customer", review = null }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const activeImage = images[index];
  const open = Boolean(activeImage);

  useDialogAccessibility({ open, dialogRef, initialFocusRef: closeButtonRef, onClose });

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") onIndexChange((index + 1) % images.length);
      if (event.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, index, images.length, onIndexChange]);

  if (!activeImage) return null;
  const name = review?.authorName || reviewerName;
  const product = review?.product;
  const productImage = product?.images?.[0]?.url;
  const rating = Math.max(0, Math.min(5, Number(review?.rating) || 0));
  const arrowClass = "absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl text-ink-900 shadow transition hover:bg-white";
  return (
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-[100] grid place-items-center bg-ink-900/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={review ? `${name}'s review` : "Customer review photo"} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-xl2 bg-white shadow-soft ${review ? "max-w-5xl md:flex-row" : "max-w-3xl"}`}>
        <button ref={closeButtonRef} type="button" onClick={onClose} className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-2xl text-ink-900 shadow transition hover:bg-white" aria-label="Close photo viewer"><HiOutlineX /></button>
        <div className="flex min-h-0 min-w-0 flex-col bg-stone-50 md:flex-[1.25]">
          <div className="relative flex h-[42vh] min-h-[220px] items-center justify-center md:h-auto md:min-h-[420px] md:flex-1">
            <img key={activeImage.url} src={activeImage.url} alt={`${name}'s review photo ${index + 1}`} className="max-h-full max-w-full object-contain" />
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => onIndexChange((index - 1 + images.length) % images.length)} className={`${arrowClass} left-3`} aria-label="Previous photo"><HiOutlineChevronLeft /></button>
                <button type="button" onClick={() => onIndexChange((index + 1) % images.length)} className={`${arrowClass} right-3`} aria-label="Next photo"><HiOutlineChevronRight /></button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-stone-200 bg-white px-3 py-3 no-scrollbar" role="group" aria-label="Review photos">
              {images.map((image, i) => (
                <button type="button" key={image.publicId || image.url || i} onClick={() => onIndexChange(i)} aria-current={i === index} aria-label={`Show photo ${i + 1} of ${images.length}`} className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-stone-50 ${i === index ? "border-forest-700" : "border-stone-200"}`}>
                  <img src={image.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
          <p className="sr-only" aria-live="polite">Photo {index + 1} of {images.length}</p>
        </div>
        {review && (
          <div className="min-h-0 min-w-0 overflow-y-auto p-5 pr-5 sm:p-7 md:flex-1">
            <p className="break-words pr-10 font-display text-xl text-ink-900">{name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="whitespace-nowrap tracking-[0.12em] text-brass-500" aria-label={`${rating} out of 5 stars`}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
              {review.verifiedPurchase === true && <span className="rounded-full border border-forest-700/20 bg-forest-700/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-forest-700">✓ Verified</span>}
            </div>
            <h2 className="mt-4 break-words font-display text-lg leading-snug text-ink-900 sm:text-xl">{review.title}</h2>
            <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-ink-900/70">{review.comment}</p>
            {product?.name && (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                {productImage && <img src={productImage} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-lg border border-stone-200 bg-white object-contain" />}
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-ink-900/45">Reviewed product</p>
                  {product.slug ? <Link onClick={onClose} to={`/products/${encodeURIComponent(product.slug)}`} className="break-words text-sm font-medium text-forest-700 hover:underline">{product.name}</Link> : <p className="break-words text-sm font-medium text-ink-900">{product.name}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewPhotoGallery({ images: rawImages = [], reviewerName = "Customer", variant = "thumbnails" }) {
  const images = usableImages(rawImages);
  const [activeIndex, setActiveIndex] = useState(-1);

  if (!images.length) return null;
  return (
    <>
      {variant === "badge" ? (
        <div role="group" aria-label={`${reviewerName}'s review photos`}>
          <button type="button" data-review-photo-index={0} onClick={() => setActiveIndex(0)} className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-ink-900/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm focus-visible:outline-offset-2" aria-label={`Open customer photo 1 of ${images.length}`}>
            <span aria-hidden="true">📷</span> {images.length} customer {images.length === 1 ? "photo" : "photos"}
          </button>
          {images.slice(1).map((image, offset) => <button type="button" key={image.publicId || image.url || offset} data-review-photo-index={offset + 1} onClick={() => setActiveIndex(offset + 1)} className="sr-only" aria-label={`Open customer photo ${offset + 2} of ${images.length}`} />)}
        </div>
      ) : variant === "featured" ? (
        <div className="overflow-hidden rounded-t-xl2 bg-stone-100" role="group" aria-label={`${reviewerName}'s review photos`}>
          <button type="button" data-review-photo-index={0} className="relative block aspect-[4/3] w-full overflow-hidden bg-stone-100 sm:aspect-[2/1] md:aspect-[21/9]" onClick={() => setActiveIndex(0)} aria-label={`Open customer photo 1 of ${images.length}`}>
            <img src={images[0].url} alt={`${reviewerName}'s review photo 1`} loading="lazy" decoding="async" className="h-full w-full object-contain" />
            {images.length > 1 && <span className="absolute right-3 top-3 rounded-full bg-ink-900/75 px-3 py-1.5 text-xs font-medium text-white">Photo 1 of {images.length}</span>}
          </button>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-3 py-3 no-scrollbar" aria-label="More review photos">
              {images.slice(1).map((image, offset) => {
                const index = offset + 1;
                return (
                  <button type="button" data-review-photo-index={index} key={image.publicId || image.url || index} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white bg-stone-200 sm:h-20 sm:w-20" onClick={() => setActiveIndex(index)} aria-label={`Open customer photo ${index + 1} of ${images.length}`}>
                    <img src={image.url} alt={`${reviewerName}'s review photo ${index + 1}`} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-5 gap-2 max-w-sm" role="group" aria-label={`${reviewerName}'s review photos`}>
          {images.map((image, index) => (
            <button
              type="button"
              key={image.publicId || image.url || index}
              data-review-photo-index={index}
              className="aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100 focus-visible:outline-offset-2"
              onClick={() => setActiveIndex(index)}
              aria-label={`Open customer photo ${index + 1} of ${images.length}`}
            >
              <img src={image.url} alt={`${reviewerName}'s review photo ${index + 1}`} loading="lazy" decoding="async" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
      <PhotoLightbox images={images} index={activeIndex} onIndexChange={setActiveIndex} onClose={() => setActiveIndex(-1)} reviewerName={reviewerName} />
    </>
  );
}
