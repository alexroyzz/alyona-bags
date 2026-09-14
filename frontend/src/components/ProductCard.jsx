import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const stockLabel = {
  in_stock: { text: "In Stock", cls: "bg-forest-600/10 text-forest-700" },
  limited: { text: "Limited Stock", cls: "bg-brass-500/10 text-brass-500" },
  out_of_stock: { text: "Out of Stock", cls: "bg-red-500/10 text-red-600" },
};

const ProductCard = ({ product, index = 0 }) => {
  const stock = stockLabel[product.stockStatus] || stockLabel.in_stock;
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.05 }}
      className="h-full"
    >
      <Link
        to={`/products/${product.slug}`}
        className="group flex h-full flex-col card-surface overflow-hidden hover:shadow-soft transition-shadow duration-300"
      >
        <div className="relative aspect-square md:aspect-[4/5] overflow-hidden bg-stone-100">
          <img
            src={product.images?.[0]?.url || ""}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </div>
        <div className="flex flex-1 flex-col p-2.5 sm:p-3.5 md:p-4">
          <p className="eyebrow text-[10px] sm:text-xs truncate">{product.category?.name}</p>
          <h3 className="mt-0.5 sm:mt-1 font-display text-[13px] sm:text-sm md:text-base text-ink-900 leading-snug line-clamp-2 break-words">
            {product.name}
          </h3>
          {displayPrice > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs sm:text-sm font-medium text-ink-900">₹{displayPrice.toLocaleString("en-IN")}</span>
              {hasDiscount && (
                <span className="text-[11px] sm:text-xs text-ink-900/35 line-through">₹{product.price.toLocaleString("en-IN")}</span>
              )}
            </div>
          )}
          <div className="mt-auto pt-2 sm:pt-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="text-[11px] sm:text-xs text-ink-900/50">MOQ {product.moq}</span>
            <span className={`text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap ${stock.cls}`}>
              {stock.text}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
