import { useEffect } from "react";
import { canonicalUrl } from "../utils/canonicalUrl.js";

const setMeta = (attribute, key, content) => {
  const selector = "meta[" + attribute + "=\"" + key + "\"]";
  let element = document.head.querySelector(selector);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const Seo = ({ title, description, path, image, imageAlt, type = "website", jsonLd, robots = "index,follow" }) => {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd).replace(/</g, "\\u003c") : "";
  useEffect(() => {
    const pageUrl = canonicalUrl(path || window.location.pathname);
    const defaultImage = document.head.querySelector('meta[name="default-social-image"]')?.content;
    const socialImage = image || defaultImage;
    document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "robots", robots);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", "Alyona Bags");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", pageUrl);
    setMeta("property", "og:image", socialImage);
    setMeta("property", "og:image:alt", socialImage ? (imageAlt || title) : "");
    setMeta("name", "twitter:card", socialImage ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", socialImage);
    setMeta("name", "twitter:image:alt", socialImage ? (imageAlt || title) : "");

    if (robots.includes("noindex")) {
      document.head.querySelector('link[rel="canonical"]')?.remove();
    } else {
      let canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = pageUrl;
    }

    document.getElementById("page-json-ld")?.remove();
    if (jsonLdText) {
      const schema = document.createElement("script");
      schema.id = "page-json-ld";
      schema.type = "application/ld+json";
      schema.textContent = jsonLdText;
      document.head.appendChild(schema);
    }
    return () => document.getElementById("page-json-ld")?.remove();
  }, [title, description, path, image, imageAlt, type, jsonLdText, robots]);

  return null;
};

export default Seo;