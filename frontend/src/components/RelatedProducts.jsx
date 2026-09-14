import { useEffect, useState } from "react";
import api from "../api/axios.js";
import ProductCard from "./ProductCard.jsx";
import { ProductGridSkeleton } from "./Skeletons.jsx";

const RelatedProducts = ({ categoryId, excludeId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    api
      .get("/products", { params: { category: categoryId, limit: 5 } })
      .then((res) => setProducts(res.data.data.filter((p) => p._id !== excludeId).slice(0, 4)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryId, excludeId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-24">
      <div className="mb-8">
        <span className="eyebrow">You May Also Like</span>
        <h2 className="mt-3 font-display text-2xl md:text-3xl text-ink-900">Related Products</h2>
      </div>
      {loading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p, i) => (
            <ProductCard key={p._id} product={p} index={i} />
          ))}
        </div>
      )}
    </section>
  );
};

export default RelatedProducts;
