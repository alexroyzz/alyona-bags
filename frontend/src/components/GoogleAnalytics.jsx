import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!/^G-[A-Z0-9]+$/.test(measurementId || "")) return;
    if (/^\/(?:admin|verify-email|reset-password|my-orders)(?:\/|$)/.test(pathname)) return;
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { send_page_view: false });
      if (!document.querySelector(`script[data-ga-id="${measurementId}"]`)) {
        const script = document.createElement("script");
        script.async = true;
        script.dataset.gaId = measurementId;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);
      }
    }
    const normalizedPath = pathname.replace(/^\/reset-password\/[^/]+$/, "/reset-password/:token");
    const pageLocation = `${window.location.origin}${normalizedPath}`;
    if (window.__alyonaLastPageView === pageLocation) return;
    window.__alyonaLastPageView = pageLocation;
    window.gtag("event", "page_view", {
      page_path: normalizedPath,
      page_location: pageLocation,
    });
  }, [pathname]);

  return null;
}
