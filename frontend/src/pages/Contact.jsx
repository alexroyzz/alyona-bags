import { useState } from "react";
import {
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios.js";

const Contact = ({ settings }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const phone = settings?.phone || "+91 90000 00000";
  const whatsapp = (settings?.whatsapp || phone).replace(/\D/g, "");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/enquiries", form);
      toast.success("Message sent — we'll be in touch soon.");
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-24 container-px">
      <div className="max-w-2xl">
        <span className="eyebrow">Get In Touch</span>
        <h1 className="mt-3 font-display text-4xl md:text-5xl text-ink-900">
          Contact Us
        </h1>
        <p className="mt-5 text-ink-900/60 leading-relaxed">
          Have a wholesale enquiry? Reach out via phone, WhatsApp, or the form
          below and our team will respond promptly.
        </p>
      </div>

      <div className="mt-16 grid lg:grid-cols-[1fr_1.2fr] gap-14">
        <div className="space-y-6">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="flex items-center gap-4 card-surface p-6 hover:shadow-soft transition-shadow"
          >
            <span className="w-12 h-12 rounded-full bg-forest-700/10 flex items-center justify-center shrink-0">
              <HiOutlinePhone className="text-xl text-forest-700" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-900/40">
                Phone
              </p>
              <p className="mt-1 text-ink-900 font-medium">{phone}</p>
            </div>
          </a>

          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 card-surface p-6 hover:shadow-soft transition-shadow"
          >
            <span className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
              <FaWhatsapp className="text-xl text-[#25D366]" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-900/40">
                WhatsApp
              </p>
              <p className="mt-1 text-ink-900 font-medium">
                {settings?.whatsapp || phone}
              </p>
            </div>
          </a>

          <a
            href={`mailto:${settings?.email || "hello@alyonabags.com"}`}
            className="flex items-center gap-4 card-surface p-6 hover:shadow-soft transition-shadow"
          >
            <span className="w-12 h-12 rounded-full bg-brass-500/10 flex items-center justify-center shrink-0">
              <HiOutlineMail className="text-xl text-brass-500" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-900/40">
                Email
              </p>
              <p className="mt-1 text-ink-900 font-medium">
                {settings?.email || "hello@alyonabags.com"}
              </p>
            </div>
          </a>

          <div className="flex items-center gap-4 card-surface p-6">
            <span className="w-12 h-12 rounded-full bg-ink-900/5 flex items-center justify-center shrink-0">
              <HiOutlineLocationMarker className="text-xl text-ink-900/70" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-900/40">
                Address
              </p>
              <p className="mt-1 text-ink-900 font-medium">
                {settings?.address || "Mumbai, Maharashtra, India"}
              </p>
            </div>
          </div>

          <div className="rounded-xl2 overflow-hidden shadow-card h-56">
            <iframe
              title="Location Map"
              src={
                settings?.mapEmbedUrl ||
                "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3499.9460476840736!2d77.0570861755447!3d28.69126047563273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d07b73919f0df%3A0x86364205f063f36a!2sAlyona%20bags%2C%20customisation%20available%20%2CPrinted%20tote%20bags%2CCotton%20tote%20bag%20%2Ccanvas%20bag%2C%20tote%20bag%20manufacturer!5e0!3m2!1sen!2sin!4v1785555711020!5m2!1sen!2sin"
              }
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-surface p-8 h-fit space-y-5"
        >
          <h3 className="font-display text-xl text-ink-900">Send a message</h3>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full name"
            className="w-full px-4 py-3.5 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
          />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number"
            className="w-full px-4 py-3.5 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
          />
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email (optional)"
            className="w-full px-4 py-3.5 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
          />
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Tell us what you're looking for..."
            rows={5}
            className="w-full px-4 py-3.5 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
