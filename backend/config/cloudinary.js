import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "alyona-bags",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1600, height: 1600, crop: "limit", quality: "auto" },
    ],
  },
});

// Dynamic storage for the About Us page: handles both images (manufacturing
// photo, quality-control poster) and video (quality-control clip) through a
// single multer instance, routing each file to the correct Cloudinary
// resource_type based on its mimetype.
const aboutStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: "alyona-bags/about",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo
        ? ["mp4", "mov", "webm", "m4v"]
        : ["jpg", "jpeg", "png", "webp"],
      transformation: isVideo
        ? undefined
        : [{ width: 1920, height: 1920, crop: "limit", quality: "auto" }],
    };
  },
});

export { cloudinary, storage, aboutStorage };

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log(
  "API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing",
);
