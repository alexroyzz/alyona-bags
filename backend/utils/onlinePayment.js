// Product fields are optional on older MongoDB documents. Only an explicit
// false opts a product out of standard online checkout.
export const isOnlinePaymentEnabled = (product) =>
  product?.onlinePaymentEnabled !== false;

export const getWholesaleOnlyProducts = (items = []) => {
  const uniqueProducts = new Map();

  for (const item of items) {
    const product = item?.product || item;
    if (!product || isOnlinePaymentEnabled(product)) continue;

    const key = String(product._id || product.id || product.name || "product");
    if (!uniqueProducts.has(key)) uniqueProducts.set(key, product);
  }

  return [...uniqueProducts.values()];
};

export const getWholesaleOnlyCheckoutMessage = (items = []) => {
  const products = getWholesaleOnlyProducts(items);
  if (products.length === 0) return "";

  const names = products.map((product) => product.name || "Unnamed product");
  return `Online checkout is unavailable for wholesale-only product${names.length === 1 ? "" : "s"}: ${names.join(", ")}. Please enquire for wholesale pricing.`;
};
