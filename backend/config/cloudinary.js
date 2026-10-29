import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createCloudinaryStorage = (resolveParams) => ({
  _handleFile(req, file, callback) {
    let callbackCalled = false;
    const finish = (error, result) => {
      if (callbackCalled) return;
      callbackCalled = true;
      callback(error, result);
    };

    Promise.resolve(resolveParams(req, file))
      .then((params) => {
        const resourceType = params.resource_type || "image";
        const uploadStream = cloudinary.uploader.upload_stream(params, (error, result) => {
          if (error) return finish(error);
          finish(null, {
            path: result.secure_url,
            size: result.bytes,
            filename: result.public_id,
            publicId: result.public_id,
            resourceType,
          });
        });
        file.stream.on("error", finish).pipe(uploadStream);
      })
      .catch(finish);
  },
  _removeFile(req, file, callback) {
    cloudinary.uploader.destroy(
      file.filename,
      { resource_type: file.resourceType || "image", invalidate: true },
      (error, result) => callback(error, result),
    );
  },
});

const storage = createCloudinaryStorage(() => ({
  folder: "alyona-bags",
  resource_type: "image",
  allowed_formats: ["jpg", "jpeg", "png", "webp"],
  transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }],
}));

// Dynamic storage for the About Us page: handles both images (manufacturing
// photo, quality-control poster) and video (quality-control clip) through a
// single multer instance, routing each file to the correct Cloudinary
// resource_type based on its mimetype.
const aboutStorage = createCloudinaryStorage((req, file) => {
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
});

export { cloudinary, storage, aboutStorage };
