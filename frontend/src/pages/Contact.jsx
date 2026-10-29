import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import Seo from "../components/Seo.jsx";
import PrivacyNotice from "../components/PrivacyNotice.jsx";
import {
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  BUSINESS_ADDRESS,
  GRIEVANCE_OFFICER_NAME,
  GRIEVANCE_OFFICER_DESIGNATION,
} from "../constants/businessInfo.js";
import { googleMapsEmbedUrl, telephoneHref, whatsappHref as makeWhatsAppHref } from "../utils/contactLinks.js";

const Contact = ({ settings }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    website: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const phone = settings?.phone?.trim() || "";
  const phoneLink = telephoneHref(phone);
  const whatsappNumber = settings?.whatsapp || phone;
  const whatsappLink = makeWhatsAppHref(whatsappNumber);
  const contactEmail = settings?.email?.trim() || BUSINESS_EMAIL;
  const mapEmbedUrl = googleMapsEmbedUrl(settings?.mapEmbedUrl);
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
      navigate("/thank-you");
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
      <Seo
        title="Contact Alyona Bags | Wholesale & Custom Orders"
        description="Contact Alyona Bags about wholesale tote bags, custom printing, bulk orders, and product enquiries."
        path="/contact"
      />
      <div className="max-w-2xl">
        <span className="eyebrow">Get In Touch</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl text-ink-900">
          Contact Us
        </h1>
        <p className="mt-5 text-ink-900/60 leading-relaxed">
          Have a wholesale enquiry? Reach out via phone, WhatsApp, or the form
          below and our team will respond promptly.
        </p>
      </div>

      <div className="mt-10 sm:mt-16 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-10 lg:gap-14">
        <div className="space-y-6">
          {phoneLink && (
            <a
              href={phoneLink}
              aria-label={`Call Us at ${phone} (opens your device’s phone app)`}
              className="flex items-center gap-4 card-surface p-6 hover:shadow-soft transition-shadow"
            >
              <span className="w-12 h-12 rounded-full bg-forest-700/10 flex items-center justify-center shrink-0">
                <HiOutlinePhone className="text-xl text-forest-700" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-900/40">Call Us</p>
                <p className="mt-1 text-ink-900 font-medium">{phone}</p>
                <p className="mt-1 text-xs text-ink-900/50">Opens your device’s phone app</p>
              </div>
            </a>
          )}

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat on WhatsApp at ${settings?.whatsapp || phone} (opens WhatsApp in a new tab)`}
              className="flex items-center gap-4 card-surface p-6 hover:shadow-soft transition-shadow"
            >
              <span className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                <FaWhatsapp className="text-xl text-[#25D366]" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-900/40">Chat on WhatsApp</p>
                <p className="mt-1 text-ink-900 font-medium">{settings?.whatsapp || phone}</p>
                <p className="mt-1 text-xs text-ink-900/50">Opens WhatsApp (external service) in a new tab or app</p>
              </div>
            </a>
          )}

          <a
            href={`mailto:${contactEmail}`}
            className="flex items-center gap-4 card-surface p-6 hover:shadow-soft transition-shadow"
          >
            <span className="w-12 h-12 rounded-full bg-brass-500/10 flex items-center justify-center shrink-0">
              <HiOutlineMail className="text-xl text-brass-500" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-900/40">
                Email
              </p>
              <p className="mt-1 text-ink-900 font-medium break-all">
                {contactEmail}
              </p>
            </div>
          </a>

          {settings?.address && (
            <div className="flex items-center gap-4 card-surface p-6">
              <span className="w-12 h-12 rounded-full bg-ink-900/5 flex items-center justify-center shrink-0">
                <HiOutlineLocationMarker className="text-xl text-ink-900/70" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-900/40">Address</p>
                <p className="mt-1 text-ink-900 font-medium">{settings.address}</p>
              </div>
            </div>
          )}
          {mapEmbedUrl && (
            <div className="rounded-xl2 overflow-hidden shadow-card h-56">
              <iframe
                title="Location Map"
                src={mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
        <form
          onSubmit={handleSubmit}
          className="card-surface p-8 h-fit space-y-5"
        >
          <h2 className="font-display text-xl text-ink-900">Send a message</h2>
          <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="contact-website">Leave this field empty</label>
            <input id="contact-website" name="website" value={form.website || ""} onChange={handleChange} tabIndex={-1} autoComplete="off" />
          </div>
          <label className="sr-only" htmlFor="contact-name">Full name</label>
          <input
            id="contact-name"
            name="name"
            aria-label="Full name"
            required
            minLength={2}
            maxLength={120}
            value={form.name}
            onChange={handleChange}
            placeholder="Full name"
            className="w-full px-4 py-3.5 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-base sm:text-sm"
          />
          <label className="sr-only" htmlFor="contact-phone">Phone number</label>
          <input
            id="contact-phone"
            name="phone"
            aria-label="Phone number"
            type="tel"
            required
            minLength={7}
            maxLength={20}
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number"
            className="w-full px-4 py-3.5 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-base sm:text-sm"
          />
          <label className="sr-only" htmlFor="contact-email">Email address, optional</label>
          <input
            id="contact-email"
            name="email"
            aria-label="Email address, optional"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email (optional)"
            className="w-full px-4 py-3.5 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-base sm:text-sm"
          />
          <label className="sr-only" htmlFor="contact-message">Enquiry message</label>
          <textarea
            id="contact-message"
            name="message"
            aria-label="Enquiry message"
            value={form.message}
            onChange={handleChange}
            placeholder="Tell us what you're looking for..."
            rows={5}
            className="w-full px-4 py-3.5 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-base sm:text-sm resize-none"
          />
          <PrivacyNotice />
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>

      <section
        id="grievance"
        aria-labelledby="grievance-heading"
        className="mt-20 max-w-3xl scroll-mt-28"
      >
        <span className="eyebrow">Complaints &amp; Privacy Requests</span>
        <h2 id="grievance-heading" className="mt-3 font-display text-3xl text-ink-900">
          Complaints and Grievance Officer
        </h2>
        <p className="mt-4 text-sm leading-7 text-ink-900/70">
          If you have a complaint about an order, a product, the website or how your information is handled, or you want to make a
          privacy request, you can send it to us using the contact form above or by email. For a record of your complaint, please
          write to us rather than only calling. Include your name, contact details, your order ID if there is one, and what went
          wrong or what you would like us to do.
        </p>

        <div className="card-surface mt-6 p-6">
          <h3 className="text-xs uppercase tracking-widest text-ink-900/50">Grievance Officer</h3>
          <dl className="mt-3 space-y-2 text-sm text-ink-900/80">
            {GRIEVANCE_OFFICER_NAME && (
              <div>
                <dt className="inline font-medium text-ink-900">Name: </dt>
                <dd className="inline">{GRIEVANCE_OFFICER_NAME}</dd>
              </div>
            )}
            <div>
              <dt className="inline font-medium text-ink-900">Designation: </dt>
              <dd className="inline">{GRIEVANCE_OFFICER_DESIGNATION}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-ink-900">Email: </dt>
              <dd className="inline break-all">
                <a href={`mailto:${BUSINESS_EMAIL}`} className="text-forest-700 underline underline-offset-2">
                  {BUSINESS_EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-ink-900">Address: </dt>
              <dd className="inline">
                {BUSINESS_NAME}, {BUSINESS_ADDRESS}
              </dd>
            </div>
          </dl>
        </div>

        <h3 className="mt-8 font-display text-xl text-ink-900">How we handle complaints</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-ink-900/70 marker:text-brass-500">
          <li>The owner receives your complaint by email or through the contact form.</li>
          <li>We record it and acknowledge it within 48 hours of receiving it.</li>
          <li>We review it, and may ask you for more details such as photographs or an unboxing video for a product issue.</li>
          <li>We reply with the outcome and, where a remedy applies, what we will do. We aim to resolve complaints within one month of receiving them.</li>
        </ol>
        <p className="mt-4 text-sm leading-7 text-ink-900/70">
          This process does not limit any right you have under applicable law, including any right to approach other authorities or
          forums. See also our{" "}
          <Link to="/terms-and-conditions#returns-refunds" className="text-forest-700 underline underline-offset-2">
            returns and refunds terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy#your-rights" className="text-forest-700 underline underline-offset-2">
            privacy rights
          </Link>
          .
        </p>
      </section>
    </div>
  );
};

export default Contact;
