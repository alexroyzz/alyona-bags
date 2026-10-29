import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { HiOutlineSearch } from "react-icons/hi";
import api from "../api/axios.js";
import ProductCard from "../components/ProductCard.jsx";
import { ProductGridSkeleton } from "../components/Skeletons.jsx";
import Seo from "../components/Seo.jsx";
import { canonicalSiteOrigin } from "../utils/canonicalUrl.js";
import { buildBreadcrumbStructuredData } from "../../../shared/structuredData.mjs";
import { CATALOGUE_HEADING } from "../../../shared/pageMeta.mjs";
import NotFound from "./NotFound.jsx";

const Categories = ({ categories, categoriesReady = true }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: routeSlug } = useParams();
  const activeCatSlug = routeSlug || searchParams.get("cat") || "";
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const requestId = useRef(0);

  const activeCategory = categories.find((c) => c.slug === activeCatSlug);
  // On /categories/:slug the category list is needed before anything can be shown:
  // wait for it (the server already supplied the page's title/canonical), and treat a
  // slug that is not in a successfully loaded list as a genuine "not found" page.
  const waitingForCategory = Boolean(routeSlug) && !categoriesReady;
  const unknownCategory = Boolean(routeSlug) && categoriesReady && categories.length > 0 && !activeCategory;
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1;

  // Keep the visible search field in sync with browser back/forward navigation.
  useEffect(() => {
    const query = searchParams.get("q") || "";
    if (query !== search) setSearch(query);
    if (query !== debouncedSearch) setDebouncedSearch(query);
  }, [searchParams]);

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
    if (waitingForCategory || unknownCategory) return;
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
        setLoadError(false);
      }
    } catch {
      if (currentRequestId === requestId.current) {
        setProducts([]);
        setLoadError(true);
      }
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [activeCategory?._id, debouncedSearch, page, waitingForCategory, unknownCategory]);

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

  // Real links (not buttons) so every category URL is crawlable from the catalogue page.
  const categoryHref = (slug) => {
    const query = searchParams.get("q");
    return `${slug ? `/categories/${encodeURIComponent(slug)}` : "/categories"}${query ? `?q=${encodeURIComponent(query)}` : ""}`;
  };

  const goToPage = (n) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("page", String(n));
      return p;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (unknownCategory) return <NotFound />;

  return (
    <div className="pt-32 pb-24 container-px">
      {!waitingForCategory && <Seo
        title={(activeCategory?.name || "Wholesale Tote Bags").slice(0, 48) + " | Alyona Bags"}
        description={(activeCategory?.description || "Browse Alyona Bags' cotton and canvas tote bag catalogue. Find customizable styles and wholesale options for your business.").replace(/\s+/g, " ").slice(0, 155)}
        path={activeCategory ? "/categories/" + encodeURIComponent(activeCategory.slug) : routeSlug ? "/categories/" + encodeURIComponent(routeSlug) : "/categories"}
        jsonLd={activeCategory ? buildBreadcrumbStructuredData(canonicalSiteOrigin(), [
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          { name: activeCategory.name, path: "/categories/" + encodeURIComponent(activeCategory.slug) },
        ]) : undefined}
      />}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-900/50">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link to="/" className="hover:text-ink-900">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to="/categories" className="hover:text-ink-900">Categories</Link></li>
          {activeCategory && (
            <>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink-900/70">{activeCategory.name}</li>
            </>
          )}
        </ol>
      </nav>
      <div className="max-w-2xl">
        <span className="eyebrow">Catalogue</span>
        <h1 className="mt-3 font-display text-4xl text-ink-900">
          {activeCategory ? activeCategory.name : CATALOGUE_HEADING}
        </h1>
        {activeCategory?.description?.trim() && (
          <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-900/70">
            {activeCategory.description.trim()}
          </p>
        )}
        <p className="mt-4 text-sm leading-relaxed text-ink-900/60">
          Need bulk quantities or custom branding?{" "}
          <Link to="/contact" className="text-forest-700 underline underline-offset-2">Send a wholesale enquiry</Link>
          {" "}or read the <Link to="/faq" className="text-forest-700 underline underline-offset-2">wholesale FAQs</Link>.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="mt-8 relative max-w-md">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-900/40" />
        <input
          aria-label="Search products and materials"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products, materials..."
          className="w-full pl-11 pr-4 py-3.5 rounded-full border border-stone-200 bg-white focus:border-forest-700 outline-none text-base sm:text-sm"
        />
      </form>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        <aside className="min-w-0" aria-label="Filter products by category">
          <h2 className="text-xs uppercase tracking-widest text-ink-900/50 mb-3">Categories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar lg:block lg:space-y-2 lg:overflow-visible lg:pb-0" role="group" aria-label="Product categories">
          <Link
            to={categoryHref("")}
            aria-current={!activeCatSlug ? "page" : undefined}
            className={`flex min-h-11 w-auto shrink-0 items-center whitespace-nowrap text-left px-4 py-2.5 rounded-lg text-sm transition-colors lg:w-full ${
              !activeCatSlug ? "bg-forest-700 text-stone-50" : "hover:bg-stone-100 text-ink-900/70"
            }`}
          >
            All Categories
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={categoryHref(cat.slug)}
              aria-current={activeCatSlug === cat.slug ? "page" : undefined}
              className={`flex min-h-11 w-auto shrink-0 items-center whitespace-nowrap text-left px-4 py-2.5 rounded-lg text-sm transition-colors lg:w-full ${
                activeCatSlug === cat.slug ? "bg-forest-700 text-stone-50" : "hover:bg-stone-100 text-ink-900/70"
              }`}
            >
              {cat.name}
            </Link>
          ))}
          </div>
        </aside>

        <div>
          {loading ? (
            <ProductGridSkeleton count={9} />
          ) : loadError ? (
            <div role="alert" className="py-20 text-center text-ink-900/60">
              <p>We couldn’t load products right now.</p>
              <button type="button" onClick={fetchProducts} className="btn-secondary mt-4 min-h-11 !px-5">Try again</button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center text-ink-900/50">
              No products found. Try a different search or category.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
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
                      aria-current={page === i + 1 ? "page" : undefined}
                      aria-label={`Go to page ${i + 1}`}
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
