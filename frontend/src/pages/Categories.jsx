import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { HiOutlineSearch } from "react-icons/hi";
import api from "../api/axios.js";
import ProductCard from "../components/ProductCard.jsx";
import { ProductGridSkeleton } from "../components/Skeletons.jsx";
import Seo from "../components/Seo.jsx";

const Categories = ({ categories }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug: routeSlug } = useParams();
  const activeCatSlug = routeSlug || searchParams.get("cat") || "";
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const activeCategory = categories.find((c) => c.slug === activeCatSlug);
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = search.trim();
      setDebouncedSearch(query);
      setSearchParams((previous) => {
        const params = new URLSearchParams(previous);
        if (query) params.set("q", query);
        else params.delete("q");
        if (query !== debouncedSearch && params.get("page") !== "1") {
          params.set("page", "1");
        }
        return params;
      }, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch, setSearchParams]);

  const fetchProducts = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (activeCategory) params.category = activeCategory._id;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get("/products", { params });
      if (currentRequestId === requestId.current) {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch {
      if (currentRequestId === requestId.current) setProducts([]);
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [activeCategory?._id, debouncedSearch, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (search.trim()) p.set("q", search.trim()); else p.delete("q");
      p.set("page", "1");
      return p;
    });
    setDebouncedSearch(search.trim());
  };

  const selectCategory = (slug) => {
    const query = searchParams.get("q");
    navigate(`${slug ? `/categories/${encodeURIComponent(slug)}` : "/categories"}${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  };

  const goToPage = (n) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("page", String(n));
      return p;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="pt-32 pb-24 container-px">
      <Seo
        title={`${(activeCategory?.name || "Wholesale Tote Bags").slice(0, 48)} | Alyona Bags`}
        description={(activeCategory?.description || "Browse Alyona Bags' cotton and canvas tote bag catalogue. Find customizable styles and wholesale options for your business.").replace(/\s+/g, " ").slice(0, 155)}
        path={activeCategory ? `/categories/${activeCategory.slug}` : routeSlug ? `/categories/${routeSlug}` : "/categories"}
      />
      <div className="max-w-2xl">
        <span className="eyebrow">Catalogue</span>
        <h1 className="mt-3 font-display text-4xl text-ink-900">
          {activeCategory ? activeCategory.name : "All Products"}
        </h1>
      </div>

      <form onSubmit={handleSearchSubmit} className="mt-8 relative max-w-md">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-900/40" />
        <input
          aria-label="Search products and materials"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products, materials..."
          className="w-full pl-11 pr-4 py-3.5 rounded-full border border-stone-200 bg-white focus:border-forest-700 outline-none text-sm"
        />
      </form>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        <aside className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-ink-900/40 mb-3">Categories</h3>
          <button
            onClick={() => selectCategory("")}
            className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
              !activeCatSlug ? "bg-forest-700 text-stone-50" : "hover:bg-stone-100 text-ink-900/70"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => selectCategory(cat.slug)}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                activeCatSlug === cat.slug ? "bg-forest-700 text-stone-50" : "hover:bg-stone-100 text-ink-900/70"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </aside>

        <div>
          {loading ? (
            <ProductGridSkeleton count={9} />
          ) : products.length === 0 ? (
            <div className="py-24 text-center text-ink-900/50">
              No products found. Try a different search or category.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((p, i) => (
                  <ProductCard key={p._id} product={p} index={i} />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  {Array.from({ length: pagination.pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToPage(i + 1)}
                      className={`w-10 h-10 rounded-full text-sm transition-colors ${
                        page === i + 1 ? "bg-forest-700 text-stone-50" : "bg-white border border-stone-200 text-ink-900/60 hover:border-forest-700"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
