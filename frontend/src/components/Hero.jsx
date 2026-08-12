import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineArrowRight } from "react-icons/hi";

const FALLBACK_HERO = "";

const Hero = ({ settings, phone = "+91 90000 00000" }) => {
  const heroImage = settings?.heroBanner?.url || FALLBACK_HERO;

  return (
    <section className="relative h-[620px] sm:h-[700px] md:h-screen w-full overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Alyona Bags wholesale collection"
          className="w-full h-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/60 to-transparent md:from-ink-900/95 md:via-ink-900/40 md:to-transparent" />
      </div>

      <div className="relative h-full container-px flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-xl pt-20"
        >
          <span className="eyebrow text-brass-400">
            Wholesale Bag Manufacturer
          </span>
          <h1 className="mt-5 font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-stone-50">
            Bags built for the shelf, not the season.
          </h1>
          <p className="mt-6 text-stone-300 text-base md:text-lg leading-relaxed max-w-md">
            Alyona Bags manufactures premium totes, backpacks, and travel bags
            at wholesale scale — engineered for durability, priced for
            distribution.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/categories" className="btn-primary">
              Explore Collection <HiOutlineArrowRight />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
