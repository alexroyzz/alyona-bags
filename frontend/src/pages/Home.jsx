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
import ProductCard from "../components/ProductCard.jsx";
import { ProductGridSkeleton } from "../components/Skeletons.jsx";

const whyPoints = [
  {
    icon: HiOutlineBadgeCheck,
    title: "Premium Craftsmanship",
    text: "Every bag is built with reinforced stitching and durable hardware, made to outlast the trend cycle.",
  },
  {
    icon: HiOutlineScale,
    title: "Wholesale Pricing",
    text: "Transparent bulk pricing tiers designed for retailers, distributors, and private-label buyers.",
  },
  {
    icon: HiOutlineTruck,
    title: "Reliable Fulfilment",
    text: "Consistent production timelines and dependable dispatch, so your shelves are never empty.",
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
      <Hero settings={settings} phone={settings?.phone} />

      {/* Categories */}
      <section className="container-px py-24">
        <div className="flex items-end justify-between mb-10">
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.slice(0, 6).map((cat, i) => (
            <CategoryCard key={cat._id} category={cat} index={i} />
          ))}

          {categories.length === 0 && (
            <p className="col-span-full text-ink-900/50 text-sm">
              Categories will appear here once added.
            </p>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-stone-100 py-24">
        <div className="container-px">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="eyebrow">Best Sellers</span>

              <h2 className="mt-3 font-display text-3xl md:text-4xl text-ink-900">
                Featured Products
              </h2>
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
          src={
            settings?.aboutSectionImage?.url ||
            "https://res.cloudinary.com/l53ehn3v/image/upload/v1783949087/WhatsApp_Image_2026-07-02_at_11.51.03_AM_1_turnnw.jpg"
          }
          alt="Alyona Bags manufacturing"
          className="rounded-xl2 shadow-card w-full h-[500px] object-contain bg-white"
        />

        <div>
          <span className="eyebrow">About Alyona Bags</span>

          <h2 className="mt-3 font-display text-3xl md:text-4xl text-ink-900">
            Built by manufacturers, for retailers.
          </h2>

          <p className="mt-5 text-ink-900/60 leading-relaxed">
            {settings?.aboutContent ||
              "Alyona Bags is a premium wholesale bag manufacturer, crafting durable and stylish bags for retailers and distributors worldwide. From concept to production, every piece is designed to perform at retail."}
          </p>

          <Link
            to="/about"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:gap-3 transition-all"
          >
            Learn more about us <HiOutlineArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
