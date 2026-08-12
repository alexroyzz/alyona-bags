import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    message: { type: String, trim: true, default: "" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    productName: { type: String, default: "" }, // snapshot in case product is deleted
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Enquiry", enquirySchema);
