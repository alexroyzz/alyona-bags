import Product from "../models/Product.js";
import { createProductSlug, productSlugIdentifier } from "./productSlug.js";

// Safe to run repeatedly: each prior URL is retained for API/redirect lookup.
const migrateProductSlugs = async () => {
  const cursor = Product.find({}).select("name slug material").lean().cursor();
  let updated = 0;
  for await (const product of cursor) {
    const slug = createProductSlug(product.name, productSlugIdentifier(product), product.material);
    if (!product.slug || product.slug === slug) continue;
    await Product.collection.updateOne(
      { _id: product._id },
      {
        $set: { slug },
        $addToSet: { legacySlugs: product.slug },
      },
    );
    updated += 1;
  }
  if (process.env.NODE_ENV !== "production") {
    console.log(`Product slug migration complete (${updated} updated)`);
  }
};

export default migrateProductSlugs;
