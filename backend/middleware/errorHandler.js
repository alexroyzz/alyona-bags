export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = res.statusCode === 200
    ? err.status || err.statusCode || 500
    : res.statusCode;
  let message = err.message;

  if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  }

  if (err.name === "MulterError") {
    statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = err.code === "LIMIT_FILE_SIZE"
      ? "Uploaded file exceeds the allowed size"
      : "Upload exceeds the allowed file or field limits";
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" && statusCode >= 500
      ? "Internal server error"
      : message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
