import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlinePhone,
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
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [printingType, setPrintingType] = useState("plain");
  const [instructions, setInstructions] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${slug}`)
      .then((res) => {
        setProduct(res.data.data);
        setSelectedColor(res.data.data.colors?.[0] || "");
        setQuantity(1);
        setPrintingType("plain");
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [slug]);

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
  const phone = settings?.phone || "+91 90000 00000";
  const waNumber = (settings?.whatsapp || phone).replace(/\D/g, "");
  const hasDiscount =
    product.discountPrice > 0 && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;
  const outOfStock =
    product.stockStatus === "out_of_stock" || product.stockQuantity === 0;

  const handleAddToCart = async () => {
    setAdding(true);

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

    setAdding(false);
    return ok;
  };

  const handleBuyNow = async () => {
    setAdding(true);

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
      logo: uploadedLogo,
    });

    setAdding(false);

    if (ok) navigate("/cart");
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
    <div className="pt-32 pb-24 container-px">
      <div className="text-xs text-ink-900/40 mb-8">
        <Link to="/" className="hover:text-ink-900">
          Home
        </Link>{" "}
        /{" "}
        <Link to="/categories" className="hover:text-ink-900">
          Categories
        </Link>{" "}
        / <span className="text-ink-900/70">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-14">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 self-start">
          <ProductGallery images={product.images} />
        </div>

        {/* Details */}
        <div>
          <div>
            <span className="eyebrow">{product.category?.name}</span>
            <h1 className="mt-3 font-display text-3xl md:text-4xl text-ink-900 leading-tight">
              {product.name}
            </h1>
          </div>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
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
          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-3xl text-ink-900">
              ₹{displayPrice?.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-lg text-ink-900/35 line-through">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            )}
            {hasDiscount && (
              <span className="text-xs px-2 py-1 rounded-full bg-brass-500/10 text-brass-500 font-medium">
                {Math.round(
                  100 - (product.discountPrice / product.price) * 100,
                )}
                % off
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-900/40">
            Inclusive of all taxes. Wholesale pricing available on bulk orders.
          </p>

          {/* Specification */}
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 py-6 border-y border-stone-200">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-ink-900/40">
                Material
              </h4>
              <p className="mt-1.5 text-sm text-ink-900">{product.material}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-ink-900/40">
                MOQ
              </h4>
              <p className="mt-1.5 text-sm text-ink-900">{product.moq}</p>
            </div>
            {product.colors?.length > 0 && (
              <div className="col-span-2">
                <h4 className="text-xs uppercase tracking-widest text-ink-900/40 mb-2.5">
                  Available Colors
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
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
                <h4 className="text-xs uppercase tracking-widest text-ink-900/40 mb-2.5">
                  Features
                </h4>
                <ul className="space-y-1.5">
                  {product.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-ink-900/70"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brass-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {product.allowCustomPrint && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-ink-900 mb-3">
                Printing Option
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPrintingType("plain")}
                  className={`rounded-xl border p-4 transition-all ${
                    printingType === "plain"
                      ? "border-forest-700 bg-forest-700 text-white"
                      : "border-stone-200 hover:border-forest-700"
                  }`}
                >
                  <h4 className="font-medium">Plain Product</h4>

                  <p className="text-xs mt-1 opacity-70">
                    Buy without any printing
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintingType("custom")}
                  className={`rounded-xl border p-4 transition-all ${
                    printingType === "custom"
                      ? "border-forest-700 bg-forest-700 text-white"
                      : "border-stone-200 hover:border-forest-700"
                  }`}
                >
                  <h4 className="font-medium">Custom Logo Print</h4>

                  <p className="text-xs mt-1 opacity-70">
                    Upload your own branding
                  </p>
                </button>
              </div>
            </div>
          )}

          {printingType === "custom" && (
            <div className="mt-6 rounded-xl border border-stone-200 p-5 bg-stone-50">
              <h3 className="font-semibold text-lg">Upload Your Logo</h3>

              <p className="text-sm text-ink-900/60 mt-1">
                Upload your company logo for custom printing.
              </p>

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  console.log(file);

                  if (file) {
                    setLogoFile(file);
                  }
                }}
              />
            </div>
          )}

          {/* Quantity + Add to cart / Buy now */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-stone-200 rounded-full">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-ink-900/60 hover:text-ink-900"
              >
                <HiOutlineMinus />
              </button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-ink-900/60 hover:text-ink-900"
              >
                <HiOutlinePlus />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
              className="btn-secondary flex-1 min-w-[160px] disabled:opacity-50"
            >
              <HiOutlineShoppingBag /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock || adding}
              className="btn-primary flex-1 min-w-[160px] disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-ink-900/50">
            <HiOutlineTruck className="text-base" />{" "}
            {product.shippingInfo || "Ships within 3-5 business days."}
          </div>

          {/* Wholesale contact actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, I'm interested in ${product.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary !py-2.5 !px-5 text-xs"
            >
              <FaWhatsapp /> WhatsApp
            </a>
            <button
              onClick={() => setModalOpen(true)}
              className="btn-secondary !py-2.5 !px-5 text-xs"
            >
              Request Bulk Quote
            </button>
          </div>

          {/* Accordion */}
          <div className="mt-10">
            <Accordion items={accordionItems} defaultOpenIndex={0} />
          </div>
        </div>
      </div>

      {/* Sticky action bar - mobile */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-stone-50 border-t border-stone-200 px-4 py-3 flex gap-3 shadow-soft"
      >
        <button
          onClick={handleAddToCart}
          disabled={outOfStock || adding}
          className="btn-secondary flex-1 !py-3 text-sm disabled:opacity-50"
        >
          Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          disabled={outOfStock || adding}
          className="btn-primary flex-1 !py-3 text-sm disabled:opacity-50"
        >
          Buy Now
        </button>
      </motion.div>

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
