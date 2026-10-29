const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

export const safeWebUrl = (value) => {
  try {
    const url = new URL(String(value ?? ""));
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

export const googleMapsEmbedUrl = (value) => {
  const safeUrl = safeWebUrl(value);
  if (!safeUrl) return "";
  const url = new URL(safeUrl);
  const isMapsPath = url.pathname === "/maps" || url.pathname.startsWith("/maps/");
  return ["www.google.com", "maps.google.com"].includes(url.hostname) && isMapsPath
    ? url.href
    : "";
};

export const telephoneHref = (value) => {
  const raw = String(value ?? "").trim();
  const digits = digitsOnly(raw);
  if (digits.length < 7 || digits.length > 15) return "";
  return "tel:" + (raw.startsWith("+") ? "+" : "") + digits;
};

export const whatsappHref = (value, message = "") => {
  const raw = String(value ?? "").trim();
  const digits = digitsOnly(raw);
  const hasInternationalPrefix = raw.startsWith("+") || digits.length >= 11;
  if (!hasInternationalPrefix || digits.length > 15 || digits.length < 7) return "";
  const query = message ? "?text=" + encodeURIComponent(message) : "";
  return "https://wa.me/" + digits + query;
};
