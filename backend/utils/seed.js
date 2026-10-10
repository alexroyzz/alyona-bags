// Run with: npm run seed
// Creates the initial admin account and a default settings document.
import dotenv from "dotenv";
dotenv.config();
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";
import Settings from "../models/Settings.js";

const seed = async () => {
  await connectDB();

  const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (!existingAdmin) {
    await Admin.create({
      name: process.env.ADMIN_NAME || "Alyona Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    console.log("Admin account created:", process.env.ADMIN_EMAIL);
  } else {
    console.log("Admin account already exists, skipping.");
  }

  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    await Settings.create({
      companyName: "Alyona Bags",
      phone: "+91 90000 00000",
      whatsapp: "+91 90000 00000",
      email: "hello@alyonabags.com",
      address: "Plot 12, Industrial Estate, Mumbai, Maharashtra, India",
      aboutContent:
        "Alyona Bags is a premium wholesale bag manufacturer, crafting durable and stylish bags for retailers and distributors worldwide.",
      mission: "To deliver premium quality bags at scale, with uncompromising craftsmanship and reliability.",
      vision: "To become a globally trusted name in wholesale bag manufacturing.",
    });
    console.log("Default settings created.");
  }

  console.log("Seed complete.");
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
