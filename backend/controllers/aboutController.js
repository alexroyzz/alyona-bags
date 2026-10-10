import asyncHandler from "express-async-handler";
import AboutPage from "../models/AboutPage.js";
import { cloudinary } from "../config/cloudinary.js";

const TEXT_FIELDS = [
  "story.heading",
  "story.text",
  "manufacturing.eyebrow",
  "manufacturing.heading",
  "manufacturing.text",
  "qualityControl.eyebrow",
  "qualityControl.heading",
  "qualityControl.text",
  "impact.eyebrow",
  "impact.heading",
  "cta.eyebrow",
  "cta.heading",
  "cta.description",
  "cta.buttonText",
];

// @desc    Get About Us page content
// @route   GET /api/about
// @access  Public
export const getAboutPage = asyncHandler(async (req, res) => {
  let about = await AboutPage.findOne();
  if (!about) {
    about = await AboutPage.create({});
  }
  res.json({ success: true, data: about });
});

// @desc    Update About Us page content
// @route   PUT /api/about
// @access  Private (Admin)
export const updateAboutPage = asyncHandler(async (req, res) => {
  let about = await AboutPage.findOne();
  if (!about) about = new AboutPage();

  TEXT_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) about.set(field, req.body[field]);
  });

  // Impact statistics arrive as a JSON string so admins can add / edit /
  // delete / reorder them together in one save.
  if (req.body.impactStats !== undefined) {
    try {
      const stats = JSON.parse(req.body.impactStats);
      if (Array.isArray(stats)) {
        about.impactStats = stats
          .filter((s) => s && (s.label || s.value))
          .map((s, index) => ({
            label: s.label || "",
            value: s.value || "",
            order: index,
          }));
      }
    } catch (err) {
      res.status(400);
      throw new Error("Invalid impactStats data");
    }
  }

  // Quality-control checklist arrives as a JSON string array so admins can
  // add / edit / delete / reorder the checklist items in one save.
  if (req.body.qualityChecklist !== undefined) {
    try {
      const items = JSON.parse(req.body.qualityChecklist);
      if (Array.isArray(items)) {
        about.qualityControl.checklist = items
          .map((i) => (typeof i === "string" ? i.trim() : ""))
          .filter(Boolean);
      }
    } catch (err) {
      res.status(400);
      throw new Error("Invalid qualityChecklist data");
    }
  }

  if (req.files?.manufacturingImage?.[0]) {
    if (about.manufacturing.image?.publicId) {
      await cloudinary.uploader
        .destroy(about.manufacturing.image.publicId)
        .catch(() => {});
    }
    about.manufacturing.image = {
      url: req.files.manufacturingImage[0].path,
      publicId: req.files.manufacturingImage[0].filename,
    };
  }

  if (req.files?.qualityVideo?.[0]) {
    if (about.qualityControl.video?.publicId) {
      await cloudinary.uploader
        .destroy(about.qualityControl.video.publicId, { resource_type: "video" })
        .catch(() => {});
    }
    about.qualityControl.video = {
      url: req.files.qualityVideo[0].path,
      publicId: req.files.qualityVideo[0].filename,
    };
  }

  if (req.files?.qualityPoster?.[0]) {
    if (about.qualityControl.poster?.publicId) {
      await cloudinary.uploader
        .destroy(about.qualityControl.poster.publicId)
        .catch(() => {});
    }
    about.qualityControl.poster = {
      url: req.files.qualityPoster[0].path,
      publicId: req.files.qualityPoster[0].filename,
    };
  }

  await about.save();
  res.json({ success: true, data: about });
});
