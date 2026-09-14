import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CategoryCard = ({ category, index = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5, delay: (index % 6) * 0.06 }}
    className={className}
  >
    <Link
      to={`/categories?cat=${category.slug}`}
      className="group relative block aspect-[3/4] rounded-xl2 overflow-hidden shadow-card"
    >
      <img
        src={category.image?.url || ""}
        alt={category.name}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5 md:p-6">
        <h3 className="font-display text-[13px] leading-tight md:text-xl md:leading-normal text-stone-50 line-clamp-2">
          {category.name}
        </h3>
        <span className="mt-0.5 md:mt-2 inline-flex items-center gap-1 text-[10px] md:text-xs text-stone-200/80 group-hover:text-brass-400 transition-colors">
          Explore range →
        </span>
      </div>
    </Link>
  </motion.div>
);

export default CategoryCard;
