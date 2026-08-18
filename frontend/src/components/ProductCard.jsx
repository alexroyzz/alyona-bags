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
    >
      <Link
        to={`/products/${product.slug}`}
        className="group block card-surface overflow-hidden hover:shadow-soft transition-shadow duration-300"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
          <img
            src={product.images?.[0]?.url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </div>
        <div className="p-5">
          <p className="eyebrow">{product.category?.name}</p>
          <h3 className="mt-1.5 font-display text-lg text-ink-900 leading-snug">{product.name}</h3>
          {displayPrice > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-sm font-medium text-ink-900">₹{displayPrice.toLocaleString("en-IN")}</span>
              {hasDiscount && (
                <span className="text-xs text-ink-900/35 line-through">₹{product.price.toLocaleString("en-IN")}</span>
              )}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-ink-900/50">MOQ {product.moq}</span>
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${stock.cls}`}>
              {stock.text}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
