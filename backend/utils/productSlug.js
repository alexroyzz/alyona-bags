import slugify from "slugify";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "by", "for", "from", "in",
  "of", "on", "or", "the", "to", "with", "women", "woman", "girls",
  "girl", "men", "man",
]);

export const createProductSlug = (name, identifier, material = "") => {
  const nameWords = slugify(name || "product", { lower: true, strict: true })
    .split("-")
    .filter((word) => word && !STOP_WORDS.has(word));
  const materialWords = slugify(material || "", { lower: true, strict: true })
    .split("-")
    .filter((word) => word && !STOP_WORDS.has(word));
  const keywords = [...nameWords.slice(0, 6)];
  for (const word of materialWords) {
    if (!keywords.includes(word) && keywords.length < 8) keywords.push(word);
  }
  const safeIdentifier = slugify(String(identifier || "product"), {
    lower: true,
    strict: true,
  });
  return `${keywords.join("-") || "product"}-${safeIdentifier}`;
};

export const productSlugIdentifier = (product) => {
  // Keep the original URL's unique suffix during slug migration/renames.
  const oldSuffix = String(product.slug || "").match(/-([a-f\d]{5,24})$/i)?.[1];
  if (oldSuffix) return oldSuffix;
  return String(product._id || Date.now()).slice(-8);
};
