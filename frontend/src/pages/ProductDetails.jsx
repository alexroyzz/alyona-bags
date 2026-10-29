import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  HiOutlineShoppingBag,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineTruck,
} from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import QuoteModal from "../components/QuoteModal.jsx";
import ProductGallery from "../components/ProductGallery.jsx";
import Accordion from "../components/Accordion.jsx";
import RelatedProducts from "../components/RelatedProducts.jsx";

import { useCart } from "../context/CartContext.jsx";
import userApi from "../api/userAxios.js";
import Seo from "../components/Seo.jsx";
import { canonicalSiteOrigin } from "../utils/canonicalUrl.js";
import { whatsappHref as makeWhatsAppHref } from "../utils/contactLinks.js";
import { buildProductStructuredData } from "../../../shared/structuredData.mjs";

const stockLabel = {
  in_stock: { text: "In Stock", cls: "bg-forest-600/10 text-forest-700" },
  limited: { text: "Limited Stock", cls: "bg-brass-500/10 text-brass-500" },
  out_of_stock: { text: "Out of Stock", cls: "bg-red-500/10 text-red-600" },
};

const ProductDetails = ({ settings }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [printingType, setPrintingType] = useState("plain");
  const [instructions, setInstructions] = useState("");
  const [logoFile, setLogoFile] = useState(null);

  // Sticky purchase bar: shown only while the inline purchase section (and the
  // footer) are off-screen, so the buttons are never duplicated or covering content.
  const [purchaseEl, setPurchaseEl] = useState(null);
  const [purchaseInView, setPurchaseInView] = useState(true);
  const [footerInView, setFooterInView] = useState(false);
  const [stickyBarHeight, setStickyBarHeight] = useState(0);
  const stickyBarRef = useRef(null);
  const actionLock = useRef(false);
  const setPurchaseRef = useCallback((node) => setPurchaseEl(node), []);

  useEffect(() => {
    if (!purchaseEl || typeof IntersectionObserver === "undefined") return undefined;
    setPurchaseInView(true);
    // Treat the section as "in view" until its bottom edge has scrolled above
    // the fixed header, so the bar appears only once the buttons are really gone.
    const observer = new IntersectionObserver(
      ([entry]) => setPurchaseInView(entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(purchaseEl);
    return () => observer.disconnect();
  }, [purchaseEl]);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [purchaseEl]);

  const onlinePaymentEnabled = product?.onlinePaymentEnabled !== false;
  const showStickyBar = onlinePaymentEnabled && !purchaseInView && !footerInView && !modalOpen;

  // Publish the bar height so the floating WhatsApp button can sit above it.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--sticky-bar-offset", showStickyBar ? stickyBarHeight + "px" : "0px");
    return () => root.style.removeProperty("--sticky-bar-offset");
  }, [showStickyBar, stickyBarHeight]);

  useEffect(() => {
    if (!showStickyBar || !stickyBarRef.current) return undefined;
    const el = stickyBarRef.current;
    const update = () => setStickyBarHeight(el.offsetHeight);
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showStickyBar]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setRatingSummary(null);
    api
      .get(`/products/${slug}`)
      .then((res) => {
        if (!active) return;
        const currentProduct = res.data.data;
        setProduct(currentProduct);
        api.get(`/products/${encodeURIComponent(currentProduct.slug)}/reviews`)
          .then((reviewResponse) => {
            if (!active) return;
            const summary = reviewResponse.data.data;
            setRatingSummary(summary.count > 0 ? { ratingValue: summary.averageRating, reviewCount: summary.count } : null);
          })
          .catch(() => { if (active) setRatingSummary(null); });
        if (currentProduct.slug && currentProduct.slug !== slug) {
          navigate(`/products/${encodeURIComponent(currentProduct.slug)}`, { replace: true });
        }
        setSelectedColor(currentProduct.colors?.[0] || "");
        setQuantity(1);
        setPrintingType("plain");
      })
      .catch(() => { if (active) setProduct(null); })
      .finally(() => { if (active) setLoading(false); });
    window.scrollTo(0, 0);
    return () => { active = false; };
  }, [slug, navigate]);

  if (loading) return <Loader full />;

  if (!product) {
    return (
      <div className="pt-40 pb-24 text-center container-px">
        <h2 className="font-display text-2xl text-ink-900">
          Product not found
        </h2>
        <Link
          to="/categories"
          className="mt-4 inline-block text-forest-700 underline"
        >
          Back to catalogue
        </Link>
      </div>
    );
  }

  const stock = stockLabel[product.stockStatus] || stockLabel.in_stock;
  const hasDiscount =
    product.discountPrice > 0 && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;
  const outOfStock =
    product.stockStatus === "out_of_stock" || product.stockQuantity === 0;
  const productDescription = (product.description || (product.name + " from Alyona Bags.")).replace(/\s+/g, " ").slice(0, 155);
  const productImage = product.images?.[0]?.url;
  const productUrl = `${window.location.origin}/products/${encodeURIComponent(product.slug)}`;
  const productWhatsAppMessage = onlinePaymentEnabled
    ? `Hi, I'm interested in ${product.name}`
    : `Hi, I'd like to enquire about wholesale pricing, quantities, customization and availability for ${product.name}. Product: ${productUrl}`;
  const productWhatsAppLink = makeWhatsAppHref(
    settings?.whatsapp || settings?.phone,
    productWhatsAppMessage,
  );
  const productSchema = buildProductStructuredData({
    siteUrl: canonicalSiteOrigin(),
    product,
    description: productDescription,
    ratingSummary,
  });
  const handleAddToCart = async () => {
    if (actionLock.current) return false;
    actionLock.current = true;
    setAdding(true);
    try {

    let uploadedLogo = null;

    if (printingType === "custom" && logoFile) {
      uploadedLogo = await uploadLogo();
    }

    const ok = await addToCart({
      productId: product._id,
      quantity,
      color: selectedColor,
      printingType,
      instructions,
      logo: uploadedLogo || {},
    });
    return ok;
    } finally {
      actionLock.current = false;
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (actionLock.current) return;
    actionLock.current = true;
    setAdding(true);
    try {

    let uploadedLogo = null;

    if (printingType === "custom" && logoFile) {
      uploadedLogo = await uploadLogo();
    }

    const ok = await addToCart({
      productId: product._id,
      quantity,
      color: selectedColor,
      printingType,
      instructions,
      logo: uploadedLogo || {},
    });

    if (ok) navigate("/cart");
    } finally {
      actionLock.current = false;
      setAdding(false);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;

    console.log("Selected File:", logoFile);
    console.log("File Name:", logoFile.name);
    console.log("File Type:", logoFile.type);

    const formData = new FormData();
    formData.append("logo", logoFile);

    try {
      const res = await userApi.post("/upload/logo", formData);

      console.log("Upload Response:", res.data);

      return res.data.data;
    } catch (err) {
      console.error(err.response?.data || err);
      return null;
    }
  };
  const accordionItems = [
    { title: "Description", content: product.description },
    {
      title: "Shipping",
      content: product.shippingInfo || "Ships within 3-5 business days.",
    },
    {
      title: "Customization",
      content:
        product.customizationInfo || "Bulk customization available on request.",
    },
    {
      title: "Care Instructions",
      content: product.careInstructions || "Wipe with a soft, dry cloth.",
    },
  ];

  return (
    <div className="pt-28 sm:pt-32 pb-28 lg:pb-24 container-px overflow-x-clip">
      <Seo
        title={`${product.name.slice(0, 45)} | Alyona Bags`}
        description={productDescription}
        path={`/products/${product.slug}`}
        image={productImage}
        imageAlt={product.name + " product image"}
        type="product"
        jsonLd={productSchema}
      />
      <nav aria-label="Breadcrumb" className="mb-5 sm:mb-8 text-xs text-ink-900/50">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <li><Link to="/" className="hover:text-ink-900">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            {product.category?.slug ? (
              <Link to={"/categories/" + encodeURIComponent(product.category.slug)} className="hover:text-ink-900">
                {product.category.name}
              </Link>
            ) : (
              <Link to="/categories" className="hover:text-ink-900">Categories</Link>
            )}
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink-900/70 break-words">{product.name}</li>
        </ol>
      </nav>
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-8 sm:gap-10 lg:gap-12 xl:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 self-start w-full min-w-0 max-w-[400px] sm:max-w-[460px] lg:max-w-[520px] xl:max-w-[560px] mx-auto lg:mx-0">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Details */}
        <div className="min-w-0">
          <div>
            <span className="eyebrow">{product.category?.name}</span>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl md:text-4xl text-ink-900 leading-tight break-words">
              {product.name}
            </h1>
          </div>

          <div className="mt-4 flex items-center gap-x-3 gap-y-2 flex-wrap">
            <span
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${stock.cls}`}
            >
              {stock.text}
            </span>
            <span className="text-sm text-ink-900/50">MOQ: {product.moq}</span>
            {product.sku && (
              <span className="text-sm text-ink-900/40">
                SKU: {product.sku}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mt-5 sm:mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-3xl text-ink-900">
              ₹{displayPrice?.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-lg text-ink-900/35 line-through">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            )}
            {hasDiscount && (
              <span className="text-xs px-2 py-1 rounded-full bg-brass-500/10 text-brass-600 font-medium">
                {Math.round(
                  100 - (product.discountPrice / product.price) * 100,
                )}
                % off
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-900/50">
            Inclusive of all taxes. Wholesale pricing available on bulk orders.
          </p>

          {/* Specification */}
          <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-5 py-5 sm:py-6 border-y border-stone-200">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-ink-900/40">
                Material
              </p>
              <p className="mt-1.5 text-sm text-ink-900 break-words">
                {product.material || "—"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-ink-900/40">
                MOQ
              </p>
              <p className="mt-1.5 text-sm text-ink-900 break-words">
                {product.moq || "—"}
              </p>
            </div>
            {product.closureType && (
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-ink-900/40">
                  Closure Type
                </p>
                <p className="mt-1.5 text-sm text-ink-900 break-words">
                  {product.closureType}
                </p>
              </div>
            )}
            {product.compartments && (
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-ink-900/40">
                  Compartments
                </p>
                <p className="mt-1.5 text-sm text-ink-900 break-words">
                  {product.compartments}
                </p>
              </div>
            )}
            {product.colors?.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-widest text-ink-900/40 mb-2.5">
                  Available Colors
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      aria-pressed={selectedColor === color}
                      className={`min-h-[40px] px-4 py-2 rounded-full text-xs border transition-colors ${
                        selectedColor === color
                          ? "border-forest-700 bg-forest-700 text-stone-50"
                          : "border-stone-200 text-ink-900/60 hover:border-forest-700"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {product.features?.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-widest text-ink-900/40 mb-2.5">
                  Features
                </p>
                <ul className="space-y-2">
                  {product.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-900/70"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brass-500 shrink-0" />
                      <span className="break-words">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {onlinePaymentEnabled && product.allowCustomPrint && (
            <div className="mt-6 sm:mt-8">
              <h3 className="text-sm font-semibold text-ink-900 mb-3">
                Printing Option
              </h3>

              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPrintingType("plain")}
                  aria-pressed={printingType === "plain"}
                  className={`min-w-0 min-h-[72px] rounded-xl border p-3.5 sm:p-4 text-left transition-all ${
                    printingType === "plain"
                      ? "border-forest-700 bg-forest-700 text-white"
                      : "border-stone-200 hover:border-forest-700"
                  }`}
                >
                  <h4 className="text-sm font-medium leading-snug break-words">Plain Product</h4>

                  <p className="text-xs mt-1 leading-snug opacity-70 break-words">
                    Buy without any printing
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintingType("custom")}
                  aria-pressed={printingType === "custom"}
                  className={`min-w-0 min-h-[72px] rounded-xl border p-3.5 sm:p-4 text-left transition-all ${
                    printingType === "custom"
                      ? "border-forest-700 bg-forest-700 text-white"
                      : "border-stone-200 hover:border-forest-700"
                  }`}
                >
                  <h4 className="text-sm font-medium leading-snug break-words">Custom Logo Print</h4>

                  <p className="text-xs mt-1 leading-snug opacity-70 break-words">
                    Upload your own branding
                  </p>
                </button>
              </div>
            </div>
          )}

          {onlinePaymentEnabled && printingType === "custom" && (
            <div className="mt-5 sm:mt-6 rounded-xl border border-stone-200 p-4 sm:p-5 bg-stone-50 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg">Upload Your Logo</h3>

              <p className="text-sm text-ink-900/60 mt-1">
                Upload your company logo for custom printing.
              </p>

              <input
                type="file"
                className="mt-3 block w-full max-w-full text-sm text-ink-900/70 file:mr-3 file:rounded-full file:border-0 file:bg-forest-700 file:px-4 file:py-2.5 file:text-xs file:font-medium file:text-stone-50"
                accept=".jpg,.jpeg,.png,.webp,image/*"
                onChange={(e) => {
                  const file = e.target.files[0];

                  if (file) {
                    setLogoFile(file);
                  }
                }}
              />
            </div>
          )}

          {/* Keep normal purchase actions for retail products; wholesale-only
              products use the existing product-linked enquiry modal instead. */}
          <div
            ref={setPurchaseRef}
            className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            {onlinePaymentEnabled ? (
              <>
                <div className="flex items-center self-start border border-stone-200 rounded-full">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-12 h-12 flex items-center justify-center text-ink-900/60 hover:text-ink-900"
                  >
                    <HiOutlineMinus />
                  </button>
                  <span className="w-10 text-center text-sm" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="w-12 h-12 flex items-center justify-center text-ink-900/60 hover:text-ink-900"
                  >
                    <HiOutlinePlus />
                  </button>
                </div>

                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={outOfStock || adding}
                    className="btn-secondary min-h-[48px] !px-4 whitespace-nowrap disabled:opacity-50"
                  >
                    <HiOutlineShoppingBag /> Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={outOfStock || adding}
                    className="btn-primary min-h-[48px] !px-4 whitespace-nowrap disabled:opacity-50"
                  >
                    Buy Now
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="btn-primary min-h-[48px] w-full sm:w-auto sm:min-w-[260px] !px-6"
              >
                Enquire for Wholesale Price
              </button>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-900/60">
            <HiOutlineTruck className="text-base shrink-0 mt-px" />
            <span className="min-w-0 break-words">
              {product.shippingInfo || "Ships within 3-5 business days."}
            </span>
          </div>

          {/* Wholesale contact actions */}
          <div className="mt-5 sm:mt-6 flex flex-wrap gap-3">
            {productWhatsAppLink && (
              <a
                href={productWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp about this product (opens WhatsApp in a new tab)"
                title="Opens WhatsApp in a new tab or app"
                className="btn-secondary flex-1 min-w-[150px] min-h-[44px] !py-2.5 !px-4 text-xs"
              >
                <FaWhatsapp /> Chat on WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-secondary flex-1 min-w-[150px] min-h-[44px] !py-2.5 !px-4 text-xs"
            >
              Request Bulk Quote
            </button>
          </div>

          {/* Accordion */}
          <div className="mt-8 sm:mt-10">
            <Accordion items={accordionItems} defaultOpenIndex={0} />
          </div>
        </div>
      </div>

      {/* Sticky action bar - mobile only. Rendered only while the inline purchase
          section and the footer are off-screen, so buttons are never doubled up. */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            ref={stickyBarRef}
            key="sticky-purchase-bar"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            role="region"
            aria-label="Quick purchase"
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-stone-50 border-t border-stone-200 px-4 pt-3 flex gap-3 shadow-soft"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
              className="btn-secondary flex-1 min-h-[48px] !px-3 !py-3 text-sm whitespace-nowrap disabled:opacity-50"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={outOfStock || adding}
              className="btn-primary flex-1 min-h-[48px] !px-3 !py-3 text-sm whitespace-nowrap disabled:opacity-50"
            >
              Buy Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <RelatedProducts
        categoryId={product.category?._id}
        excludeId={product._id}
      />

      <QuoteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={product}
      />
    </div>
  );
};

export default ProductDetails;
