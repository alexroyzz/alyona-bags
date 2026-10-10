import express from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { cachePublic } from "../middleware/cache.js";
import { mongoInputGuard } from "../middleware/mongoInputGuard.js";

const router = express.Router();

router.get("/", cachePublic, getSettings);
router.put(
  "/",
  protect,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "heroBanner", maxCount: 1 },
    { name: "aboutSectionImage", maxCount: 1 },
  ]),
  mongoInputGuard,
  updateSettings
);

export default router;
