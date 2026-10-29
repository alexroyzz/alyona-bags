import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { canonicalUrl } from "../utils/canonicalUrl.js";
import { NOINDEX_ROBOTS } from "../utils/robots.js";

const privatePages = {
  "/login": ["Sign In | Alyona Bags", "Sign in to your Alyona Bags customer account."],
  "/register": ["Create Account | Alyona Bags", "Create an Alyona Bags customer account to manage orders and checkout."],
  "/verify-email": ["Verify Email | Alyona Bags", "Verify your email address for your Alyona Bags account."],
  "/forgot-password": ["Forgot Password | Alyona Bags", "Request a password reset for your Alyona Bags account."],
  "/cart": ["Your Cart | Alyona Bags", "Review your Alyona Bags order and checkout details."],
  "/order-success": ["Order Confirmed | Alyona Bags", "Your Alyona Bags order confirmation."],
  "/order-failure": ["Payment Update | Alyona Bags", "Review the payment status for your Alyona Bags order."],
  "/my-orders": ["My Orders | Alyona Bags", "View your Alyona Bags order history and delivery status."],
  "/my-profile": ["My Account | Alyona Bags", "Manage your Alyona Bags account and saved addresses."],
  "/admin/login": ["Admin Sign In | Alyona Bags", "Alyona Bags administration sign in."],
  "/admin/dashboard": ["Admin Dashboard | Alyona Bags", "Alyona Bags administration dashboard."],
  "/admin/products": ["Manage Products | Alyona Bags", "Manage the Alyona Bags product catalogue."],
  "/admin/categories": ["Manage Categories | Alyona Bags", "Manage Alyona Bags product categories."],
  "/admin/orders": ["Manage Orders | Alyona Bags", "Manage Alyona Bags customer orders."],
  "/admin/enquiries": ["Manage Enquiries | Alyona Bags", "Manage customer enquiries for Alyona Bags."],
  "/admin/settings": ["Site Settings | Alyona Bags", "Manage Alyona Bags site settings."],
  "/admin/about": ["Manage About Page | Alyona Bags", "Manage the Alyona Bags about page."],
  "/admin/reviews": ["Manage Reviews | Alyona Bags", "Moderate customer reviews for Alyona Bags."],
};

const isPageWithOwnSeo = (path) =>
  path === "/" || path === "/categories" || path.startsWith("/categories/") ||
  path.startsWith("/products/") || ["/about", "/contact", "/reviews", "/faq", "/privacy", "/terms-and-conditions", "/thank-you"].includes(path);

export default function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const routePath = pathname.replace(/\/+$/, "") || "/";
    const verification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
    if (verification) {
      let tag = document.head.querySelector('meta[name="google-site-verification"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = "google-site-verification";
        document.head.appendChild(tag);
      }
      tag.content = verification;
    }
    if (isPageWithOwnSeo(routePath)) return;
    let metadata = privatePages[routePath];
    if (!metadata && (routePath === "/admin" || routePath.startsWith("/admin/"))) {
      // Any other /admin/* URL (unknown or future admin page) is private too.
      metadata = ["Admin | Alyona Bags", "Alyona Bags administration."];
    } else if (!metadata && /^\/my-orders\/[^/]+$/.test(routePath)) {
      metadata = ["Order Details | Alyona Bags", "View details for your Alyona Bags order."];
    } else if (!metadata && /^\/reset-password\/[^/]+$/.test(routePath)) {
      metadata = ["Reset Password | Alyona Bags", "Choose a new password for your Alyona Bags account."];
    }
    if (!metadata) return;

    const [title, description] = metadata;
    document.title = title;
    const set = (selector, attr, key, value) => {
      let node = document.head.querySelector(selector);
      if (!node) {
        node = document.createElement("meta");
        node.setAttribute(attr, key);
        document.head.appendChild(node);
      }
      node.setAttribute("content", value);
    };
    set('meta[name="description"]', "name", "description", description);
    set('meta[name="robots"]', "name", "robots", NOINDEX_ROBOTS);
    set('meta[property="og:type"]', "property", "og:type", "website");
    set('meta[property="og:title"]', "property", "og:title", title);
    set('meta[property="og:description"]', "property", "og:description", description);
    set('meta[property="og:url"]', "property", "og:url", canonicalUrl(pathname));
    set('meta[name="twitter:card"]', "name", "twitter:card", "summary");
    set('meta[name="twitter:title"]', "name", "twitter:title", title);
    set('meta[name="twitter:description"]', "name", "twitter:description", description);
    document.head.querySelector('meta[property="og:image"]')?.remove();
    document.head.querySelector('meta[name="twitter:image"]')?.remove();
    document.head.querySelector('link[rel="canonical"]')?.remove();
  }, [pathname]);

  return null;
}
