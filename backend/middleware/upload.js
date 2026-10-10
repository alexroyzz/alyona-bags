import multer from "multer";
import { storage, aboutStorage } from "../config/cloudinary.js";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const aboutTypes = new Map([
  ...[...imageTypes].map((type) => [type, imageExtensions]),
  ["video/mp4", new Set([".mp4"])],
  ["video/quicktime", new Set([".mov"])],
  ["video/webm", new Set([".webm"])],
  ["video/x-m4v", new Set([".m4v"])],
]);

const validateFile = (allowedTypes) => (req, file, callback) => {
  const extensions = allowedTypes.get(file.mimetype);
  const extension = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();
  if (!extensions || !extensions.has(extension)) {
    const error = new Error("Unsupported or mismatched upload file type");
    error.status = 415;
    return callback(error);
  }
  callback(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8, fields: 40, parts: 50 },
  fileFilter: validateFile(new Map([...imageTypes].map((type) => [type, imageExtensions]))),
});

// Used for the About Us page, which accepts images (manufacturing photo,
// quality-control poster) and a video (quality-control clip) in the same
// request, so it needs a larger limit and video-aware storage.
export const uploadAboutMedia = multer({
  storage: aboutStorage,
  limits: { fileSize: 100 * 1024 * 1024, files: 3, fields: 40, parts: 45 },
  fileFilter: validateFile(aboutTypes),
});

export default upload;
