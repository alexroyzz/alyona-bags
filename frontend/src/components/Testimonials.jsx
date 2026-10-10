
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";

const reviews = [
  {
    name: "Divya Kumari",
    text: "Great tote bag with good material and plenty of space. Perfect for shopping and everyday use",
  },
  {
    name: "ULTiMATRiX ViKKu",
    text: "Very good matrial tote bags are good and awesome you can print your design very fast service",
  },
  {
    name: "Purvi Sharma",
    text: "Really happy with the quality of the tote bag. The material feels durable and the bag looks exactly like the pictures.",
  },
  { name: "Shekhar Shami", text: "Good Service and Products" },
  { name: "Pritam Shah", text: "Good product 😁👍" },
  {
    name: "Deepak",
    text: "Maine ye tote bag kharida bhout badiya aur premium hain aur isne Kam price pr Diya thank you ❤️",
  },
  { name: "Vikram Kumar", text: "Good product 👍👍" },
];

const Testimonials = () => {
  const reduceMotion = useReducedMotion();
  const viewportRef = useRef(null);

  const [paused, setPaused] = useState(false);
  const [setWidth, setSetWidth] = useState(0);

  // Responsive card width and gap
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateWidth = () => {
      const viewportWidth = viewport.clientWidth;

      const visibleCount =
        window.innerWidth >= 1024
          ? 3
          : window.innerWidth >= 640
            ? 2
            : 1;

      const gap = window.innerWidth >= 1024 ? 24 : 16;
      const cardWidth =
        (viewportWidth - gap * (visibleCount - 1)) / visibleCount;

      // Distance occupied by one complete set of reviews
      setSetWidth(reviews.length * (cardWidth + gap));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);
    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const gap = typeof window !== "undefined" && window.innerWidth >= 1024
    ? 24
    : 16;

  // Duplicate the same set to create a seamless loop
  const infiniteReviews = [...reviews, ...reviews];

  return (
    <section
      className="container-px overflow-hidden py-16 md:py-24"
      aria-labelledby="testimonials-heading"
    >
      <div className="mb-8 text-center md:mb-10">
        <span className="eyebrow">Kind words</span>

        <h2
          id="testimonials-heading"
          className="mt-3 font-display text-3xl text-ink-900 md:text-4xl"
        >
          What Our Customers Say
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-900/60 md:text-base">
          Trusted by customers for quality, service and custom bag solutions.
        </p>
      </div>

      <div
        ref={viewportRef}
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setPaused(false);
          }
        }}
      >
        {setWidth > 0 && (
          <motion.div
            className="flex w-max"
            style={{ gap: `${gap}px` }}
            initial={{ x: 0 }}
            animate={
              reduceMotion || paused
                ? { x: 0 }
                : { x: -setWidth }
            }
            transition={
              reduceMotion || paused
                ? { duration: 0 }
                : {
                    x: {
                      duration: 35,
                      ease: "linear",
                      repeat: Infinity,
                      repeatType: "loop",
                    },
                  }
            }
          >
            {infiniteReviews.map((review, index) => (
              <article
                key={`${review.name}-${index}`}
                className="card-surface flex min-h-[250px] flex-shrink-0 flex-col p-6 md:p-7"
                style={{
                  width: `calc((100vw - ${
                    typeof window !== "undefined" && window.innerWidth >= 1024
                      ? "2 * 24px"
                      : typeof window !== "undefined" && window.innerWidth >= 640
                        ? "16px"
                        : "0px"
                  }) / ${
                    typeof window !== "undefined" && window.innerWidth >= 1024
                      ? 3
                      : typeof window !== "undefined" && window.innerWidth >= 640
                        ? 2
                        : 1
                  })`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="text-lg leading-none tracking-[0.16em] text-brass-500"
                    role="img"
                    aria-label="5 out of 5 stars"
                  >
                    ★★★★★
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-900/45">
                    <FaGoogle className="text-[11px]" aria-hidden="true" />
                    Google Review
                  </span>
                </div>

                <p className="mt-6 flex-1 text-sm leading-7 text-ink-900/75">
                  {review.text}
                </p>

                <p className="mt-6 font-medium text-ink-900">
                  {review.name}
                </p>
              </article>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
