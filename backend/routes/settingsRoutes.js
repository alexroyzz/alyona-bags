import express from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getSettings);
router.put(
  "/",
  protect,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "heroBanner", maxCount: 1 },
    { name: "aboutSectionImage", maxCount: 1 },
  ]),
  updateSettings
);

export default router;
