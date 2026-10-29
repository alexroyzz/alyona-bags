export const canonicalSiteOrigin = () => {
  const configured = document.head.querySelector('meta[name="site-origin"]')?.content;
  try { return new URL(configured || window.location.origin).origin; }
  catch { return window.location.origin; }
};

export const canonicalUrl = (path = window.location.pathname) => {
  const url = new URL(path, canonicalSiteOrigin() + "/");
  url.search = "";
  url.hash = "";
  return url.href;
};