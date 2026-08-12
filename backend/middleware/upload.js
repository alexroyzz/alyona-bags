import multer from "multer";
import { storage, aboutStorage } from "../config/cloudinary.js";

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
});

// Used for the About Us page, which accepts images (manufacturing photo,
// quality-control poster) and a video (quality-control clip) in the same
// request, so it needs a larger limit and video-aware storage.
export const uploadAboutMedia = multer({
  storage: aboutStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (video)
});

export default upload;
