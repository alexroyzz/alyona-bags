import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HiOutlineTruck,
  HiOutlineBadgeCheck,
  HiOutlineScale,
  HiOutlineArrowRight,
} from "react-icons/hi";
import api from "../api/axios.js";
import Hero from "../components/Hero.jsx";
import CategoryCard from "../components/CategoryCard.jsx";
import { cloudinaryImageUrl, cloudinarySrcSet } from "../utils/cloudinaryImage.js";
import ProductCard from "../components/ProductCard.jsx";
import { ProductGridSkeleton } from "../components/Skeletons.jsx";
import Seo from "../components/Seo.jsx";

const whyPoints = [
  {
    icon: HiOutlineBadgeCheck,
    title: "Premium Craftsmanship",
    text: "Explore cotton and canvas styles with clear product details and available customization options.",
  },
  {
    icon: HiOutlineScale,
    title: "Wholesale Enquiries",
    text: "Contact our team to discuss quantities, customization and a quote for your requirements.",
  },
  {
    icon: HiOutlineTruck,
    title: "Reliable Fulfilment",
    text: "Delivery timing depends on stock availability and manufacturing requirements.",
  },
];

const Home = ({ settings, categories = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products", {
        params: {
          featured: true,
          limit: 8,
        },
      })
      .then((res) => {
        setProducts(res.data?.data || []);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <Seo
        title="Alyona Bags | Premium Cotton & Canvas Tote Bags"
        description="Discover premium cotton and canvas tote bags by Alyona Bags. Explore reusable bags, custom printing, and wholesale solutions for brands, retailers, and businesses."
        path="/"
        image={settings?.heroBanner?.url}
        imageAlt="Alyona Bags cotton and canvas tote bag collection"
      />
      <Hero settings={settings} />

      {/* Categories */}
      <section className="container-px py-8 md:py-24">
        <div className="flex items-end justify-between mb-4 md:mb-10">
          <div>
            <span className="eyebrow">Our Range</span>

            <h2 className="mt-3 font-display text-3xl md:text-4xl text-ink-900">
              Shop by Category
            </h2>
          </div>

          <Link
            to="/categories"
            className="hidden md:flex items-center gap-1 text-sm text-ink-900/70 hover:text-ink-900"
          >
            View all <HiOutlineArrowRight />
          </Link>
        </div>

        <div className="-mx-5 px-5 sm:-mx-6 sm:px-6 flex snap-x overflow-x-auto no-scrollbar touch-scroll-x gap-2.5 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-5 md:overflow-visible">
          {categories.slice(0, 6).map((cat, i) => (
            <CategoryCard
              key={cat._id}
              category={cat}
              index={i}
              className="w-[30%] min-w-[104px] max-w-[132px] shrink-0 snap-start md:w-auto md:min-w-0 md:max-w-none md:shrink"
            />
          ))}

          {categories.length === 0 && (
            <p className="text-ink-900/50 text-sm md:col-span-full">
              Categories will appear here once added.
            </p>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-stone-100 py-8 md:py-24">
        <div className="container-px">
          <div className="flex items-end justify-between mb-4 md:mb-10">
            <div>
              <span className="eyebrow">Featured Collection</span>

              <h2 className="mt-3 font-display text-3xl md:text-4xl text-ink-900">
                Featured Products
              </h2>
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
              {products.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}

              {products.length === 0 && (
                <p className="col-span-full text-ink-900/50 text-sm">
                  Featured products will appear here.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container-px py-24">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="eyebrow">Why Alyona Bags</span>

          <h2 className="mt-3 font-display text-3xl md:text-4xl text-ink-900">
            Manufacturing partners trust for scale
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {whyPoints.map((point, i) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
              }}
              className="card-surface p-8"
            >
              <point.icon className="text-3xl text-brass-500" />

              <h3 className="mt-5 font-display text-xl text-ink-900">
                {point.title}
              </h3>

              <p className="mt-3 text-sm text-ink-900/60 leading-relaxed">
                {point.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bulk Order CTA */}
      <section className="container-px pb-24">
        <div className="rounded-xl2 bg-forest-700 text-stone-50 px-8 py-16 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <span className="eyebrow text-brass-400">Bulk Orders</span>

            <h2 className="mt-3 font-display text-3xl md:text-4xl">
              Ready to stock your store?
            </h2>

            <p className="mt-4 text-stone-300">
              Talk to our wholesale team about MOQs, private labelling, and
              volume pricing.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="btn-secondary !border-stone-50/30 !text-stone-50 hover:!bg-stone-50 hover:!text-ink-900"
            >
              Request Quote
            </Link>
          </div>
        </div>
      </section>

      {/* About Company Short */}
      <section className="container-px pb-24 grid md:grid-cols-2 gap-14 items-center">
        <motion.img
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          src={cloudinaryImageUrl(
            settings?.aboutSectionImage?.url ||
              "https://res.cloudinary.com/l53ehn3v/image/upload/v1783949087/WhatsApp_Image_2026-07-02_at_11.51.03_AM_1_turnnw.jpg",
            1200,
          )}
          srcSet={cloudinarySrcSet(
            settings?.aboutSectionImage?.url ||
              "https://res.cloudinary.com/l53ehn3v/image/upload/v1783949087/WhatsApp_Image_2026-07-02_at_11.51.03_AM_1_turnnw.jpg",
            [480, 800, 1200, 1600],
          )}
          sizes="(max-width: 767px) 100vw, 50vw"
          alt="Alyona Bags manufacturing"
          loading="lazy"
          decoding="async"
          width="1200"
          height="800"
          className="rounded-xl2 shadow-card w-full h-[280px] sm:h-[400px] lg:h-[500px] object-contain bg-white"
        />

        <div>
          <span className="eyebrow">About Alyona Bags</span>

          <h2 className="mt-3 font-display text-3xl md:text-4xl text-ink-900">
            Built by manufacturers, for retailers.
          </h2>

          <p className="mt-5 text-ink-900/60 leading-relaxed">
            {settings?.aboutContent ||
              "Alyona Bags offers cotton and canvas bags for everyday use, with product details and customization options to help you find the right style."}
          </p>

          <Link
            to="/about"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:gap-3 transition-all"
          >
            Learn more about us <HiOutlineArrowRight />
          </Link>
          <Link
            to="/faq"
            className="mt-4 ml-5 inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:gap-3 transition-all"
          >
            Read our FAQs <HiOutlineArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
