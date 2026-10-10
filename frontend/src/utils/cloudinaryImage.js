const CLOUDINARY_UPLOAD_PATH = "/upload/";

export const cloudinaryImageUrl = (url, width, height) => {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes(CLOUDINARY_UPLOAD_PATH)) {
    return url || "";
  }

  const resize = height
    ? `f_auto,q_auto,c_fill,w_${width},h_${height}`
    : `f_auto,q_auto,c_limit,w_${width}`;
  return url.replace(CLOUDINARY_UPLOAD_PATH, `${CLOUDINARY_UPLOAD_PATH}${resize}/`);
};

export const cloudinarySrcSet = (url, widths, heightForWidth) =>
  url
    ? widths
        .map((width) => {
          const height = heightForWidth ? heightForWidth(width) : undefined;
          return `${cloudinaryImageUrl(url, width, height)} ${width}w`;
        })
        .join(", ")
    : "";
