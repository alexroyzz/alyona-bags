import { useEffect } from "react";

const setMeta = (attribute, key, content) => {
  if (!content) return;
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const Seo = ({ title, description, path, image, type = "website", jsonLd, robots = "index,follow" }) => {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd).replace(/</g, "\\u003c") : "";
  useEffect(() => {
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", "Alyona Bags");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", `${window.location.origin}${path || window.location.pathname}`);
    setMeta("name", "robots", robots);
    if (image) setMeta("property", "og:image", image);
    else document.head.querySelector('meta[property="og:image"]')?.remove();
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    if (image) setMeta("name", "twitter:image", image);
    else document.head.querySelector('meta[name="twitter:image"]')?.remove();

    if (robots.includes("noindex")) {
      document.head.querySelector('link[rel="canonical"]')?.remove();
    } else {
      let canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = `${window.location.origin}${path || window.location.pathname}`;
    }

    const oldSchema = document.getElementById("page-json-ld");
    oldSchema?.remove();
    if (jsonLdText) {
      const schema = document.createElement("script");
      schema.id = "page-json-ld";
      schema.type = "application/ld+json";
      schema.textContent = jsonLdText;
      document.head.appendChild(schema);
    }
    return () => document.getElementById("page-json-ld")?.remove();
  }, [title, description, path, image, type, jsonLdText, robots]);

  return null;
};

export default Seo;
