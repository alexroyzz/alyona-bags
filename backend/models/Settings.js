import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: "Alyona Bags" },
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    heroBanner: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    // Image shown in the Home page's "About Alyona Bags" section.
    // Separate from the About Us page's own media (see AboutPage model).
    aboutSectionImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    aboutContent: { type: String, default: "" },
    mission: { type: String, default: "" },
    vision: { type: String, default: "" },
    mapEmbedUrl: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    socialLinks: {
      instagram: { type: String, default: "" },
      x: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      facebook: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
