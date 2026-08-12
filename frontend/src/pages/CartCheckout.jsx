import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineShoppingBag,
  HiOutlineLockClosed,
  HiOutlineTruck,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import { useCart } from "../context/CartContext.jsx";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import userApi from "../api/userAxios.js";
import { loadRazorpayScript } from "../utils/loadRazorpay.js";
import Loader from "../components/Loader.jsx";

const emptyAddress = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

// Minimal underline input — used throughout the address form so it reads as
// an editorial detail entry rather than a boxed dashboard form.
const FieldInput = (props) => (
  <input
    {...props}
    className="w-full bg-transparent border-0 border-b border-stone-300 focus:border-forest-700 outline-none text-sm py-2.5 placeholder:text-ink-900/30 transition-colors"
  />
);

const CartCheckout = () => {
  const { cart, subtotal, loading: cartLoading, updateQuantity, removeItem, clearCart } = useCart();
  const { user, setUserOverride } = useUserAuth();
  const navigate = useNavigate();

  const items = cart.items || [];

  // ---------- Address ----------
  const addresses = user?.addresses || [];
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [changingAddress, setChangingAddress] = useState(false); // shows the saved-address picker
  const [addingAddress, setAddingAddress] = useState(false); // shows the add/edit form
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def._id);
    }
    if (addresses.length === 0) {
      setAddingAddress(true);
      setNewAddress((a) => ({ ...a, fullName: user?.name || "", phone: user?.phone || "" }));
    }
  }, [addresses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

  const handleSaveAddress = async () => {
    const required = ["fullName", "phone", "line1", "city", "state", "pincode"];
    for (const f of required) {
      if (!newAddress[f]?.trim()) {
        toast.error("Please complete all required address fields");
        return;
      }
    }
    setSavingAddress(true);
    try {
      const res = await userApi.post("/users/me/addresses", {
        ...newAddress,
        isDefault: addresses.length === 0 ? true : newAddress.isDefault,
      });
      const updated = { ...user, addresses: res.data.addresses };
      setUserOverride(updated);
      const saved = res.data.addresses[res.data.addresses.length - 1];
      setSelectedAddressId(saved._id);
      setAddingAddress(false);
      setChangingAddress(false);
      setNewAddress(emptyAddress);
      toast.success("Address saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const res = await userApi.delete(`/users/me/addresses/${id}`);
      setUserOverride({ ...user, addresses: res.data.addresses });
      if (selectedAddressId === id) setSelectedAddressId(res.data.addresses[0]?._id || null);
      toast.success("Address removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove address");
    }
  };

  // ---------- Seller instructions (order-level note) ----------
  const [sellerNote, setSellerNote] = useState("");

  // ---------- Place order ----------
  const [placing, setPlacing] = useState(false);

  const total = subtotal;

  const buildShippingAddress = () => {
    if (selectedAddress && !addingAddress) {
      const { fullName, phone, line1, line2, city, state, pincode, country } = selectedAddress;
      return { fullName, phone, line1, line2, city, state, pincode, country };
    }
    return newAddress;
  };

  const validateAddress = () => {
    const addr = buildShippingAddress();
    const required = ["fullName", "phone", "line1", "city", "state", "pincode"];
    for (const field of required) {
      if (!addr[field]?.trim()) {
        toast.error("Please select or complete a shipping address");
        return false;
      }
    }
    return true;
  };

  const placeOrder = async (razorpayPayload) => {
    setPlacing(true);
    try {
      const res = await userApi.post("/orders", {
        shippingAddress: buildShippingAddress(),
        paymentMethod: "razorpay",
        razorpay: razorpayPayload,
        notes: sellerNote,
      });
      await clearCart();
      navigate("/order-success", { state: { order: res.data.data } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place order");
      navigate("/order-failure");
    } finally {
      setPlacing(false);
    }
  };

  const handlePayAndPlace = async () => {
    if (!validateAddress()) return;
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setPlacing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Could not load payment gateway. Please try again.");
        setPlacing(false);
        return;
      }

      const { data } = await userApi.post("/payment/razorpay/order", { amount: total });
      const { orderId, amount, currency, keyId } = data.data;
      const addr = buildShippingAddress();

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "Alyona Bags",
        description: "Order Payment",
        order_id: orderId,
        prefill: { name: addr.fullName, contact: addr.phone, email: user?.email },
        theme: { color: "#242E20" },
        handler: (response) => {
          placeOrder({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
        },
        modal: { ondismiss: () => setPlacing(false) },
      });

      rzp.on("payment.failed", () => {
        setPlacing(false);
        navigate("/order-failure");
      });

      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment could not be initiated");
      setPlacing(false);
    }
  };

  if (cartLoading) return <Loader full />;

  return (
    <div className="pt-28 md:pt-36 pb-32">
      <div className="container-px">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-stone-200 pb-8 md:pb-10">
          <div>
            <span className="eyebrow">Checkout</span>
            <h1 className="mt-3 font-display text-4xl md:text-5xl text-ink-900">
              Complete Your Order
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-ink-900/30">
            <span className="text-forest-700 font-semibold">Bag</span>
            <span className="w-8 h-px bg-stone-300" />
            <span className="text-forest-700 font-semibold">Delivery</span>
            <span className="w-8 h-px bg-stone-300" />
            <span>Payment</span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-20 text-center py-24">
            <HiOutlineShoppingBag className="text-5xl text-ink-900/15 mx-auto" />
            <p className="mt-5 text-ink-900/50">Your bag is empty.</p>
            <Link to="/categories" className="btn-primary mt-7 inline-flex">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="mt-14 grid lg:grid-cols-[1fr_1px_400px] gap-x-12">
            {/* LEFT — Your Selection */}
            <div>
              <div className="flex items-baseline justify-between mb-6">
                <span className="eyebrow">Your Selection</span>
                <span className="text-xs text-ink-900/40">
                  {items.length} item{items.length > 1 ? "s" : ""}
                </span>
              </div>

              <div>
                {items.map((item) => {
                  const price =
                    item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price || 0;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.35 }}
                      key={item._id}
                      className="flex gap-6 sm:gap-8 py-8 border-b border-stone-200 first:pt-0 last:border-0"
                    >
                      <img
                        src={item.product?.images?.[0]?.url}
                        alt=""
                        className="w-28 h-36 sm:w-36 sm:h-44 object-cover bg-stone-100 shrink-0"
                      />

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <Link
                            to={`/products/${item.product?.slug}`}
                            className="font-display text-xl sm:text-2xl text-ink-900 hover:text-forest-700 transition-colors leading-tight"
                          >
                            {item.product?.name}
                          </Link>
                          <span className="hidden sm:block font-display text-lg text-ink-900 shrink-0">
                            ₹{(price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] uppercase tracking-[0.15em] text-ink-900/40">
                          {item.color && <span>{item.color}</span>}
                          <span>{item.printingType === "custom" ? "Custom Printing" : "Plain"}</span>
                        </div>

                        {(item.logo?.url || item.instructions) && (
                          <div className="mt-3 flex items-center gap-3">
                            {item.logo?.url && (
                              <img
                                src={item.logo.url}
                                alt="Logo"
                                className="w-10 h-10 object-contain bg-stone-100 border border-stone-200 p-1"
                              />
                            )}
                            {item.instructions && (
                              <p className="text-xs text-ink-900/40 italic truncate">"{item.instructions}"</p>
                            )}
                          </div>
                        )}

                        <div className="mt-auto pt-6 flex items-center justify-between">
                          <div className="flex items-center gap-5 border-b border-stone-300 pb-1.5">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="text-ink-900/50 hover:text-forest-700 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <HiOutlineMinus />
                            </button>
                            <span className="w-5 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="text-ink-900/50 hover:text-forest-700 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <HiOutlinePlus />
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="sm:hidden font-display text-base text-ink-900">
                              ₹{(price * item.quantity).toLocaleString("en-IN")}
                            </span>
                            <button
                              onClick={() => removeItem(item._id)}
                              className="text-xs text-ink-900/35 hover:text-red-500 underline underline-offset-4 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Vertical divider (desktop only) */}
            <div className="hidden lg:block bg-stone-200" />

            {/* RIGHT — Delivery + Summary, single continuous panel */}
            <div className="mt-16 lg:mt-0 lg:sticky lg:top-32 h-fit">
              {/* Delivery address */}
              <div className="pb-8 border-b border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Deliver To</span>
                  {selectedAddress && !addingAddress && (
                    <button
                      onClick={() => setChangingAddress((v) => !v)}
                      className="text-xs uppercase tracking-wide text-forest-700 hover:text-forest-900 underline underline-offset-4"
                    >
                      {changingAddress ? "Close" : "Change Address"}
                    </button>
                  )}
                </div>

                {/* Compact premium summary of the selected address */}
                {selectedAddress && !addingAddress && !changingAddress && (
                  <div className="mt-4">
                    <p className="font-display text-lg text-ink-900">{selectedAddress.fullName}</p>
                    <p className="mt-1.5 text-sm text-ink-900/55">{selectedAddress.phone}</p>
                    <p className="mt-1.5 text-sm text-ink-900/55 leading-relaxed">
                      {selectedAddress.line1}
                      {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}, {selectedAddress.city},{" "}
                      {selectedAddress.state} — {selectedAddress.pincode}
                    </p>
                    <span className="mt-3 inline-block text-[10px] uppercase tracking-[0.2em] text-brass-500">
                      {selectedAddress.label || "Home"} Address
                    </span>
                  </div>
                )}

                {/* Saved-address picker — appears only after "Change Address" */}
                <AnimatePresence>
                  {changingAddress && !addingAddress && addresses.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 divide-y divide-stone-200">
                        {addresses.map((addr) => (
                          <label
                            key={addr._id}
                            className="flex items-start gap-3 py-4 cursor-pointer group"
                          >
                            <span
                              className={`mt-1.5 w-3 h-3 rounded-full border shrink-0 transition-colors ${
                                selectedAddressId === addr._id
                                  ? "border-forest-700 bg-forest-700"
                                  : "border-stone-300 group-hover:border-forest-700"
                              }`}
                            />
                            <input
                              type="radio"
                              className="sr-only"
                              checked={selectedAddressId === addr._id}
                              onChange={() => {
                                setSelectedAddressId(addr._id);
                                setChangingAddress(false);
                              }}
                            />
                            <div className="flex-1 min-w-0 text-sm">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-ink-900">{addr.fullName}</span>
                                <span className="text-[10px] uppercase tracking-wide text-ink-900/40">
                                  {addr.label || "Home"}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[10px] uppercase tracking-wide text-brass-500">Default</span>
                                )}
                              </div>
                              <p className="text-ink-900/50 mt-1">
                                {addr.line1}
                                {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteAddress(addr._id);
                              }}
                              className="text-xs text-ink-900/30 hover:text-red-500 underline underline-offset-4 shrink-0"
                            >
                              Delete
                            </button>
                          </label>
                        ))}

                        <button
                          onClick={() => {
                            setAddingAddress(true);
                            setNewAddress({ ...emptyAddress, fullName: user?.name || "", phone: user?.phone || "" });
                          }}
                          className="pt-4 text-sm font-medium text-forest-700 hover:text-forest-900"
                        >
                          + Add New Address
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add-address form — minimal underline fields */}
                <AnimatePresence>
                  {addingAddress && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-1">
                        <FieldInput
                          value={newAddress.fullName}
                          onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                          placeholder="Full name"
                        />
                        <FieldInput
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          placeholder="Phone number"
                        />
                        <div className="sm:col-span-2">
                          <FieldInput
                            value={newAddress.line1}
                            onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                            placeholder="Complete address"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldInput
                            value={newAddress.line2}
                            onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                            placeholder="Landmark (optional)"
                          />
                        </div>
                        <FieldInput
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          placeholder="City"
                        />
                        <FieldInput
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          placeholder="State"
                        />
                        <FieldInput
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                          placeholder="Pincode"
                        />
                        <select
                          value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                          className="bg-transparent border-0 border-b border-stone-300 focus:border-forest-700 outline-none text-sm py-2.5 text-ink-900/70"
                        >
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-6 mt-6">
                        <button
                          onClick={handleSaveAddress}
                          disabled={savingAddress}
                          className="btn-primary !py-2.5 !px-6 text-xs tracking-wide disabled:opacity-60"
                        >
                          {savingAddress ? "Saving..." : "Save Address"}
                        </button>
                        {addresses.length > 0 && (
                          <button
                            onClick={() => {
                              setAddingAddress(false);
                              setChangingAddress(false);
                            }}
                            className="text-xs text-ink-900/40 hover:text-ink-900 underline underline-offset-4"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Order totals */}
              <div className="py-8 border-b border-stone-200 space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-900/50">Subtotal</span>
                  <span className="text-ink-900">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-900/50">Shipping</span>
                  <span className="text-forest-700">Complimentary</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-900/50">Estimated Delivery</span>
                  <span className="text-ink-900">5–7 Business Days</span>
                </div>
              </div>

              <div className="py-7 flex items-baseline justify-between border-b border-stone-200">
                <span className="text-xs uppercase tracking-[0.2em] text-ink-900/50">Grand Total</span>
                <span className="font-display text-3xl text-ink-900">₹{total.toLocaleString("en-IN")}</span>
              </div>

              {/* Seller note */}
              <div className="pt-7">
                <label className="text-[11px] uppercase tracking-[0.15em] text-ink-900/40 mb-2 block">
                  Note for us (optional)
                </label>
                <textarea
                  value={sellerNote}
                  onChange={(e) => setSellerNote(e.target.value)}
                  rows={2}
                  placeholder="Any special request for your order..."
                  className="w-full bg-transparent border-0 border-b border-stone-300 focus:border-forest-700 outline-none text-sm py-2 placeholder:text-ink-900/30 resize-none transition-colors"
                />
              </div>

              <button
                onClick={handlePayAndPlace}
                disabled={placing || items.length === 0}
                className="btn-primary w-full mt-8 !py-5 text-sm tracking-[0.1em] uppercase disabled:opacity-60"
              >
                {placing ? "Processing..." : "Proceed to Secure Payment"}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-900/35">
                <HiOutlineLockClosed />
                <span>Secure payment powered by Razorpay</span>
              </div>

              {/* Trust badges — a single quiet row, not boxes */}
              <div className="mt-9 pt-7 border-t border-stone-200 grid grid-cols-3 divide-x divide-stone-200">
                <div className="flex flex-col items-center gap-2 px-2">
                  <HiOutlineShieldCheck className="text-lg text-forest-700" />
                  <span className="text-[9px] uppercase tracking-[0.15em] text-ink-900/40 text-center">
                    Secure Payment
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 px-2">
                  <HiOutlineDocumentText className="text-lg text-forest-700" />
                  <span className="text-[9px] uppercase tracking-[0.15em] text-ink-900/40 text-center">
                    GST Invoice
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 px-2">
                  <HiOutlineTruck className="text-lg text-forest-700" />
                  <span className="text-[9px] uppercase tracking-[0.15em] text-ink-900/40 text-center">
                    Fast Delivery
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartCheckout;
