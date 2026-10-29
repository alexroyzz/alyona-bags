import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineX } from "react-icons/hi";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import PrivacyNotice from "./PrivacyNotice.jsx";
import useDialogAccessibility from "../hooks/useDialogAccessibility.js";

const QuoteModal = ({ open, onClose, product }) => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", website: "" });
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const navigate = useNavigate();

  useDialogAccessibility({ open, dialogRef, initialFocusRef: closeButtonRef, onClose, closeDisabled: submitting });

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
      onClose();
      navigate("/thank-you");
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
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-ink-900/60 backdrop-blur-sm overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-dialog-title"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-stone-50 rounded-xl2 w-full max-w-md p-5 pt-6 sm:p-8 relative shadow-soft max-h-[calc(100dvh-1.5rem)] overflow-y-auto"
          >
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 w-11 h-11 flex items-center justify-center text-ink-900/50 hover:text-ink-900"
              aria-label="Close"
            >
              <HiOutlineX className="text-xl" />
            </button>
            <span className="eyebrow">Request a Quote</span>
            <h2 id="quote-dialog-title" className="mt-2 pr-8 font-display text-xl sm:text-2xl text-ink-900 break-words">
              {product ? product.name : "Get in touch"}
            </h2>
            <p className="mt-1 text-sm text-ink-900/60">
              Share your details and our team will reach out with pricing and MOQ.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="quote-website">Leave this field empty</label>
                <input id="quote-website" name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
              </div>
              <label className="sr-only" htmlFor="quote-name">Full name</label>
              <input
                id="quote-name"
                name="name"
                aria-label="Full name"
                required
                minLength={2}
                maxLength={120}
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-forest-700 outline-none text-base sm:text-sm"
              />
              <label className="sr-only" htmlFor="quote-phone">Phone number</label>
              <input
                id="quote-phone"
                name="phone"
                aria-label="Phone number"
                type="tel"
                required
                minLength={7}
                maxLength={20}
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone number"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-forest-700 outline-none text-base sm:text-sm"
              />
              <label className="sr-only" htmlFor="quote-email">Email address, optional</label>
              <input
                id="quote-email"
                name="email"
                aria-label="Email address, optional"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email (optional)"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-forest-700 outline-none text-base sm:text-sm"
              />
              <label className="sr-only" htmlFor="quote-message">Enquiry message</label>
              <textarea
                id="quote-message"
                name="message"
                aria-label="Enquiry message"
                value={form.message}
                onChange={handleChange}
                placeholder="Quantity required, customization needs, etc."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white focus:border-forest-700 outline-none text-base sm:text-sm resize-none"
              />
              <PrivacyNotice />
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
