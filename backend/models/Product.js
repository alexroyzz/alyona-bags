import mongoose from "mongoose";
import { createProductSlug, productSlugIdentifier } from "../utils/productSlug.js";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    legacySlugs: { type: [String], default: [], select: false },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    moq: { type: String, required: true, default: "50 pcs" }, // Minimum Order Quantity
    material: { type: String, required: true, trim: true },
    price: { type: Number, required: true, default: 0, min: 0 }, // selling price (INR)
    discountPrice: { type: Number, default: 0, min: 0 }, // optional sale price, 0 = no discount
    sku: { type: String, trim: true, default: "" },
    stockQuantity: { type: Number, default: 100, min: 0 }, // ecommerce stock count (separate from wholesale stockStatus label)
    shippingInfo: {
      type: String,
      default:
        "Ships within 3-5 business days. Free shipping on bulk orders above the MOQ threshold.",
    },
    customizationInfo: {
      type: String,
      default:
        "Custom branding, logo printing, and packaging available on bulk orders. Contact us for details.",
    },
    careInstructions: {
      type: String,
      default:
        "Wipe with a soft, dry cloth. Avoid prolonged exposure to direct sunlight and moisture.",
    },
    closureType: { type: String, trim: true, default: "" },
    compartments: { type: String, trim: true, default: "" },
    colors: [{ type: String, trim: true }],
    description: { type: String, required: true },
    features: [{ type: String, trim: true }],
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    stockStatus: {
      type: String,
      enum: ["in_stock", "limited", "out_of_stock"],
      default: "in_stock",
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    allowCustomPrint: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

productSchema.pre("validate", function (next) {
  if (this.name && (this.isNew || this.isModified("name") || this.isModified("material") || !this.slug)) {
    const previousSlug = this.slug;
    this.slug = createProductSlug(this.name, productSlugIdentifier(this), this.material);
    if (previousSlug && previousSlug !== this.slug) {
      this.legacySlugs = [...new Set([...(this.legacySlugs || []), previousSlug])];
    }
  }
  next();
});

productSchema.index({ name: "text", description: "text", material: "text" });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });
productSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 });

export default mongoose.model("Product", productSchema);
