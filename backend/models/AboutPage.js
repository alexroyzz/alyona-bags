import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  { _id: false }
);

const statSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
});

const aboutPageSchema = new mongoose.Schema(
  {
    story: {
      heading: {
        type: String,
        default: "A wholesale bag house built on craft, quality & long-term trust.",
      },
      text: {
        type: String,
        default:
          "Alyona Bags was founded on a simple premise: retailers and brands deserve a wholesale partner that treats every order — big or small — with the same attention to material, construction and finish.\n\nToday, our catalog spans handbags, totes, backpacks, clutches and travel bags, produced for boutiques, department stores, e-commerce brands and distributors worldwide.",
      },
    },
    manufacturing: {
      eyebrow: { type: String, default: "Manufacturing" },
      heading: { type: String, default: "Production built for wholesale scale" },
      text: {
        type: String,
        default:
          "Our production lines run on a mix of skilled hand-finishing and precision machinery, letting us hold tight tolerances across cutting, stitching and hardware assembly at volume.\n\nFrom a 100-unit test order to a multi-container program, capacity is planned in advance so lead times stay predictable and quality never gets traded for speed.\n\nEvery material — leather, canvas, hardware — is sourced against approved supplier standards, so the sample you approve is exactly what ships.",
      },
      image: { type: mediaSchema, default: () => ({}) },
    },
    qualityControl: {
      eyebrow: { type: String, default: "Quality Control" },
      heading: { type: String, default: "Every batch inspected before it ships" },
      text: {
        type: String,
        default:
          "Quality checks happen at three stages — incoming materials, mid-production and pre-dispatch — so issues are caught long before a container leaves the facility.\n\nWe work as an extension of your buying team, with transparent costing, honest timelines and real people you can reach directly.",
      },
      checklist: {
        type: [String],
        default: [
          "Every batch checked against the original spec sheet before packing",
          "Stitching, hardware and finish inspected piece by piece, not by sample",
          "Reorders matched against the first shipment for exact consistency",
        ],
      },
      video: { type: mediaSchema, default: () => ({}) },
      poster: { type: mediaSchema, default: () => ({}) },
    },
    impact: {
      eyebrow: { type: String, default: "Company Impact" },
      heading: { type: String, default: "Numbers built over a decade of shipping" },
    },
    impactStats: {
      type: [statSchema],
      default: [
        { label: "Years of Experience", value: "12+", order: 0 },
        { label: "Wholesale Clients", value: "300+", order: 1 },
        { label: "Countries Served", value: "40+", order: 2 },
        { label: "Products Delivered", value: "50K+", order: 3 },
      ],
    },
    cta: {
      eyebrow: { type: String, default: "Let's Work Together" },
      heading: { type: String, default: "Ready to stock our bags in your store?" },
      description: {
        type: String,
        default:
          "Tell us your requirement — materials, quantities, branding — and our wholesale team will respond with pricing and samples.",
      },
      buttonText: { type: String, default: "Request Quote" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("AboutPage", aboutPageSchema);
