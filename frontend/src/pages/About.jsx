import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HiCheckCircle, HiOutlinePhone } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import QuoteModal from "../components/QuoteModal.jsx";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" },
};

// Media scales to its own natural aspect ratio (landscape, portrait, square —
// whatever the admin uploads) instead of being forced into a fixed crop.
// max-height only steps in as a ceiling for unusually tall assets, at which
// point object-contain lets it shrink without cropping any content.
const mediaCls =
  "block w-full h-[360px] sm:h-[420px] md:h-[460px] lg:h-[500px] object-cover rounded-xl2 shadow-card mx-auto";

// Renders admin-entered text as separate paragraphs on blank-line breaks,
// so multi-paragraph copy (Our Story, Manufacturing) reads correctly
// instead of being crammed into one dense block.
const Paragraphs = ({ text, className }) =>
  (text || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => (
      <p key={i} className={className}>
        {p}
      </p>
    ));

const About = ({ settings }) => {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    api
      .get("/about")
      .then((res) => setAbout(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Defensive: some browsers / React hydration paths don't reliably apply
  // the `muted` attribute before autoplay kicks in, which silently blocks
  // playback (or worse, lets audio through). Force it via the DOM node too.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  }, [about?.qualityControl?.video?.url]);

  if (loading) {
    return (
      <div className="pt-32 pb-24">
        <Loader full />
      </div>
    );
  }

  const stats = [...(about?.impactStats || [])].sort(
    (a, b) => a.order - b.order,
  );
  const checklist = about?.qualityControl?.checklist || [];

  const phone = settings?.phone || "";
  const whatsapp = (settings?.whatsapp || phone).replace(/\D/g, "");
  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        "Hi, I'd like to enquire about your wholesale bag catalogue.",
      )}`
    : null;
  const callHref = phone ? `tel:${phone.replace(/\s/g, "")}` : null;

  return (
    <div className="pb-24">
      {/* 1. OUR STORY */}
      <section className="container-px pt-36 md:pt-44">
        <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center">
          <span className="eyebrow">Our Story</span>
          <h1 className="mt-4 font-display text-4xl md:text-5xl leading-[1.15] text-ink-900">
            {about?.story?.heading}
          </h1>
          <Paragraphs
            text={about?.story?.text}
            className="mt-6 text-ink-900/60 leading-relaxed text-[15px] md:text-base"
          />
        </motion.div>
      </section>

      {/* 2. MANUFACTURING */}
      <section className="container-px mt-20 md:mt-30 grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="order-2 md:order-1"
        >
          {about?.manufacturing?.image?.url ? (
            <img
              src={about.manufacturing.image.url}
              alt="Manufacturing facility"
              className={mediaCls}
            />
          ) : (
            <div className="rounded-xl2 shadow-card aspect-[4/3] w-full bg-stone-200" />
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="order-1 md:order-2 max-w-md"
        >
          <span className="eyebrow">{about?.manufacturing?.eyebrow}</span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-ink-900 leading-tight">
            {about?.manufacturing?.heading}
          </h2>
          <Paragraphs
            text={about?.manufacturing?.text}
            className="mt-5 text-ink-900/60 leading-relaxed"
          />
        </motion.div>
      </section>

      {/* 3. QUALITY CONTROL */}
      <section className="container-px mt-20 md:mt-30 grid md:grid-cols-[1fr_1.2fr] gap-10 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-md"
        >
          <span className="eyebrow">{about?.qualityControl?.eyebrow}</span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-ink-900 leading-tight">
            {about?.qualityControl?.heading}
          </h2>
          <Paragraphs
            text={about?.qualityControl?.text}
            className="mt-5 text-ink-900/60 leading-relaxed"
          />
          {checklist.length > 0 && (
            <ul className="mt-6 space-y-3">
              {checklist.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-ink-900/70"
                >
                  <HiCheckCircle className="mt-0.5 shrink-0 text-lg text-brass-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        >
          {about?.qualityControl?.video?.url ? (
            <video
              ref={videoRef}
              className={`${mediaCls}`}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              preload="auto"
              poster={about?.qualityControl?.poster?.url || undefined}
              aria-label="Quality control at our manufacturing facility"
            >
              <source src={about.qualityControl.video.url} />
            </video>
          ) : (
            <div className="rounded-xl2 shadow-card aspect-video w-full bg-stone-200" />
          )}
        </motion.div>
      </section>

      {/* 4. OUR IMPACT — full-bleed dark section */}
      <section className="mt-24 md:mt-30 bg-ink-900">
        <div className="container-px py-20 md:py-24">
          <motion.div {...fadeUp} className="max-w-xl mx-auto text-center">
            <span className="eyebrow text-brass-400">
              {about?.impact?.eyebrow}
            </span>
            <h2 className="mt-4 font-display text-3xl md:text-4xl leading-tight text-stone-50">
              {about?.impact?.heading}
            </h2>
          </motion.div>

          <div className="mt-14 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-y-10">
            {stats.map((stat, i) => (
              <motion.div
                key={stat._id || i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="text-center px-2"
              >
                <p className="font-display text-4xl md:text-5xl text-brass-400">
                  {stat.value}
                </p>
                <p className="mt-2.5 text-xs uppercase tracking-[0.2em] text-stone-400">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BUILT FOR YOUR BRAND — full-bleed CTA */}
      <section>
        <div className="container-px py-20 md:py-10">
          <motion.div {...fadeUp} className="max-w-xl mx-auto text-center">
            <span className="eyebrow">{about?.cta?.eyebrow}</span>
            <h2 className="mt-4 font-display text-3xl md:text-4xl text-ink-900 leading-tight">
              {about?.cta?.heading}
            </h2>
            <p className="mt-4 text-ink-900/60 leading-relaxed">
              {about?.cta?.description}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setQuoteOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-ink-900 text-stone-50 px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-ink-800"
              >
                {about?.cta?.buttonText}
              </button>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:brightness-95"
                >
                  <FaWhatsapp className="text-base" /> WhatsApp Inquiry
                </a>
              )}
              {callHref && (
                <a
                  href={callHref}
                  className="inline-flex items-center justify-center gap-2 border border-ink-900/20 text-ink-900 px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:border-ink-900 hover:bg-ink-900 hover:text-stone-50"
                >
                  <HiOutlinePhone className="text-base" /> Call Now
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </div>
  );
};

export default About;
