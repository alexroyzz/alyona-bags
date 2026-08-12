import express from "express";
import { getAboutPage, updateAboutPage } from "../controllers/aboutController.js";
import { protect } from "../middleware/auth.js";
import { uploadAboutMedia } from "../middleware/upload.js";

const router = express.Router();

router.get("/", getAboutPage);
router.put(
  "/",
  protect,
  uploadAboutMedia.fields([
    { name: "manufacturingImage", maxCount: 1 },
    { name: "qualityVideo", maxCount: 1 },
    { name: "qualityPoster", maxCount: 1 },
  ]),
  updateAboutPage
);

export default router;
