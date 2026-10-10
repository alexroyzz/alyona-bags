import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";

export default function ThankYou() {
  return (
    <div className="pt-32 pb-24 container-px min-h-[60vh] grid place-items-center">
      <Seo title="Thank You | Alyona Bags" description="Thank you for contacting Alyona Bags. Our team will review your enquiry." path="/thank-you" robots="noindex,nofollow" />
      <div className="max-w-lg text-center">
        <p className="eyebrow">Message received</p>
        <h1 className="mt-3 font-display text-4xl text-ink-900">Thank you for reaching out</h1>
        <p className="mt-4 text-ink-900/60">Your enquiry has been sent to our team. We’ll be in touch using the contact details you provided.</p>
        <Link to="/categories" className="btn-primary inline-flex mt-8">Continue browsing</Link>
      </div>
    </div>
  );
}
