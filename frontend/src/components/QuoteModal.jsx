import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineX } from "react-icons/hi";
import toast from "react-hot-toast";
import api from "../api/axios.js";

const QuoteModal = ({ open, onClose, product }) => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/enquiries", { ...form, product: product?._id });
      toast.success("Enquiry sent — our team will contact you shortly.");
      setForm({ name: "", phone: "", email: "", message: "" });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-stone-50 rounded-xl2 w-full max-w-md p-8 relative shadow-soft"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-ink-900/50 hover:text-ink-900"
              aria-label="Close"
            >
              <HiOutlineX className="text-xl" />
            </button>
            <span className="eyebrow">Request a Quote</span>
            <h3 className="mt-2 font-display text-2xl text-ink-900">
              {product ? product.name : "Get in touch"}
            </h3>
            <p className="mt-1 text-sm text-ink-900/60">
              Share your details and our team will reach out with pricing and MOQ.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-forest-700 outline-none text-sm"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone number"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-forest-700 outline-none text-sm"
              />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email (optional)"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-forest-700 outline-none text-sm"
              />
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Quantity required, customization needs, etc."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-forest-700 outline-none text-sm resize-none"
              />
              <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
                {submitting ? "Sending..." : "Send Enquiry"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuoteModal;
