import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import { NOINDEX_ROBOTS } from "../utils/robots.js";

export default function NotFound() {
  return (
    <div className="pt-40 pb-24 text-center container-px min-h-[60vh]">
      <Seo title="Page Not Found | Alyona Bags" description="This Alyona Bags page could not be found. Browse the current bag collection or return to the home page." robots={NOINDEX_ROBOTS} />
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-3xl text-ink-900">Page not found</h1>
      <p className="mt-3 text-ink-900/60">The page you’re looking for doesn’t exist or may have moved.</p>
      <div className="mt-7 flex justify-center gap-3">
        <Link to="/" className="btn-primary">Back to Home</Link>
        <Link to="/categories" className="btn-secondary">Browse Bags</Link>
      </div>
    </div>
  );
}
