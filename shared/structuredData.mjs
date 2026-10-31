const absoluteUrl = (siteUrl, path = "/") => new URL(path, siteUrl + "/").href;

const isHttpUrl = (value) => typeof value === "string" && /^https?:\/\/\S+$/i.test(value);

// `organization` is optional and must only contain details that are really
// published on the site (Settings logo / contact email / social profile links).
export const buildSiteStructuredData = (siteUrl, organization = {}) => {
  const { logo, email, sameAs } = organization || {};
  const profiles = Array.isArray(sameAs) ? [...new Set(sameAs.filter(isHttpUrl))] : [];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization", "@id": siteUrl + "/#organization", name: "Alyona Bags", url: siteUrl,
        description: "Alyona Bags is a B2B wholesale bag supplier specializing in cotton and canvas tote bags, custom printing, and bulk bag solutions.",
        ...(isHttpUrl(logo) ? { logo } : {}),
        ...(typeof email === "string" && email.trim() ? { email: email.trim() } : {}),
        ...(typeof email === "string" && email.trim()
          ? { contactPoint: { "@type": "ContactPoint", email: email.trim() } }
          : {}),
        ...(profiles.length ? { sameAs: profiles } : {}),
      },
      { "@type": "WebSite", "@id": siteUrl + "/#website", name: "Alyona Bags", url: siteUrl, publisher: { "@id": siteUrl + "/#organization" } },
    ],
  };
};

export const buildBreadcrumbStructuredData = (siteUrl, items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(({ name, path }, index) => ({
    "@type": "ListItem", position: index + 1, name, item: absoluteUrl(siteUrl, path),
  })),
});

export const buildProductStructuredData = ({ siteUrl, product, description, ratingSummary }) => {
  const discountPrice = Number(product.discountPrice) || 0;
  const price = discountPrice > 0 && discountPrice < Number(product.price) ? discountPrice : Number(product.price) || 0;
  const reviewCount = Number(ratingSummary?.reviewCount) || 0;
  const ratingValue = Number(ratingSummary?.ratingValue) || 0;
  const images = (product.images || []).map((image) => image?.url).filter(isHttpUrl);
  const productPath = "/products/" + encodeURIComponent(product.slug);
  const productUrl = absoluteUrl(siteUrl, productPath);
  const outOfStock = product.stockStatus === "out_of_stock" || Number(product.stockQuantity) === 0;
  const productSchema = {
    "@type": "Product", name: product.name, description, url: productUrl,
    ...(images.length ? { image: images } : {}),
    ...(typeof product.sku === "string" && product.sku.trim() ? { sku: product.sku.trim() } : {}),
    brand: { "@type": "Brand", name: "Alyona Bags" },
    ...(product.category?.name ? { category: product.category.name } : {}),
    ...(reviewCount > 0 && ratingValue > 0 ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue, reviewCount },
    } : {}),
    ...(price > 0 && product.onlinePaymentEnabled !== false ? {
      offers: {
        "@type": "Offer", priceCurrency: "INR", price,
        availability: outOfStock ? "https://schema.org/OutOfStock"
          : product.stockStatus === "limited" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
        url: productUrl, itemCondition: "https://schema.org/NewCondition",
      },
    } : {}),
  };
  const category = product.category?.slug && product.category?.name
    ? { name: product.category.name, path: "/categories/" + encodeURIComponent(product.category.slug) }
    : { name: "Categories", path: "/categories" };
  return {
    "@context": "https://schema.org",
    "@graph": [
      productSchema,
      buildBreadcrumbStructuredData(siteUrl, [
        { name: "Home", path: "/" }, category, { name: product.name, path: productPath },
      ]),
    ],
  };
};
