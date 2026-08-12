import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";

// Premium product gallery: vertical thumbnail rail (desktop) + large image with hover-zoom.
const ProductGallery = ({ images = [] }) => {
  const [active, setActive] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [zooming, setZooming] = useState(false);
  const frameRef = useRef(null);

  if (!images.length) {
    return <div className="aspect-square rounded-xl2 bg-stone-100" />;
  }

  const handleMouseMove = (e) => {
    const rect = frameRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const next = () => setActive((i) => (i + 1) % images.length);
  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="flex gap-4">
      {/* Vertical thumbnails - desktop */}
      {images.length > 1 && (
        <div className="hidden md:flex flex-col gap-3 w-20 shrink-0">
          {images.map((img, i) => (
            <button
              key={img.publicId || i}
              onClick={() => setActive(i)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                i === active
                  ? "border-forest-700 shadow-card"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="flex-1 min-w-0">
        <div
          ref={frameRef}
          className="relative aspect-square rounded-xl2 overflow-hidden bg-stone-100 cursor-zoom-in select-none"
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => setZooming(false)}
          onMouseMove={handleMouseMove}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={active}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              src={images[active]?.url}
              alt=""
              className="w-full h-full object-cover"
              style={
                zooming
                  ? { transform: "scale(1.9)", transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transition: "transform 0.08s ease-out" }
                  : { transition: "transform 0.25s ease-out" }
              }
            />
          </AnimatePresence>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-card hover:bg-white transition-colors"
                aria-label="Previous image"
              >
                <HiOutlineChevronLeft />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-card hover:bg-white transition-colors"
                aria-label="Next image"
              >
                <HiOutlineChevronRight />
              </button>
              <span className="absolute bottom-3 right-3 text-[11px] px-2.5 py-1 rounded-full bg-ink-900/70 text-stone-50">
                {active + 1} / {images.length}
              </span>
            </>
          )}
        </div>

        {/* Horizontal thumbnails - mobile */}
        {images.length > 1 && (
          <div className="flex md:hidden gap-3 mt-4 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.publicId || i}
                onClick={() => setActive(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === active ? "border-forest-700" : "border-transparent opacity-60"
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGallery;
