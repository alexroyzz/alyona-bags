import asyncHandler from "express-async-handler";
import Settings from "../models/Settings.js";
import { cloudinary } from "../config/cloudinary.js";

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json({ success: true, data: settings });
});

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private (Admin)
const isValidUrl = (value) => {
  if (!value) return true; // empty is allowed — field is simply hidden
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = new Settings();

  const fields = ["companyName", "phone", "whatsapp", "email", "address", "aboutContent", "mission", "vision", "mapEmbedUrl", "gstNumber"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) settings[field] = req.body[field];
  });

  if (req.body.socialLinks !== undefined) {
    // socialLinks may arrive as a JSON string (multipart/form-data) or an object (JSON body)
    let socialLinks = req.body.socialLinks;
    if (typeof socialLinks === "string") {
      try {
        socialLinks = JSON.parse(socialLinks);
      } catch {
        res.status(400);
        throw new Error("Invalid social links data");
      }
    }

    const allowedKeys = ["instagram", "x", "linkedin", "facebook"];
    for (const key of allowedKeys) {
      const value = socialLinks?.[key];
      if (value && !isValidUrl(value)) {
        res.status(400);
        throw new Error(`Please enter a valid URL for ${key}`);
      }
    }

    settings.socialLinks = {
      instagram: socialLinks?.instagram || "",
      x: socialLinks?.x || "",
      linkedin: socialLinks?.linkedin || "",
      facebook: socialLinks?.facebook || "",
    };
  }

  if (req.files?.logo?.[0]) {
    if (settings.logo?.publicId) await cloudinary.uploader.destroy(settings.logo.publicId).catch(() => {});
    settings.logo = { url: req.files.logo[0].path, publicId: req.files.logo[0].filename };
  }

  if (req.files?.heroBanner?.[0]) {
    if (settings.heroBanner?.publicId) await cloudinary.uploader.destroy(settings.heroBanner.publicId).catch(() => {});
    settings.heroBanner = { url: req.files.heroBanner[0].path, publicId: req.files.heroBanner[0].filename };
  }

  // Home page "About Alyona Bags" section image.
  // Explicit removal (checkbox in Admin Panel) takes effect only when no
  // replacement file is sent in the same request.
  if (req.files?.aboutSectionImage?.[0]) {
    if (settings.aboutSectionImage?.publicId) await cloudinary.uploader.destroy(settings.aboutSectionImage.publicId).catch(() => {});
    settings.aboutSectionImage = { url: req.files.aboutSectionImage[0].path, publicId: req.files.aboutSectionImage[0].filename };
  } else if (req.body.removeAboutSectionImage === "true") {
    if (settings.aboutSectionImage?.publicId) await cloudinary.uploader.destroy(settings.aboutSectionImage.publicId).catch(() => {});
    settings.aboutSectionImage = { url: "", publicId: "" };
  }

  await settings.save();
  res.json({ success: true, data: settings });
});
