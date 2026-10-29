const forbiddenKey = /[.$]/;

const containsUnsafeKey = (value) => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsUnsafeKey);
  return Object.entries(value).some(
    ([key, child]) => forbiddenKey.test(key) || ["__proto__", "prototype", "constructor"].includes(key) || containsUnsafeKey(child),
  );
};

export const mongoInputGuard = (req, res, next) => {
  if ([req.body, req.query, req.params].some(containsUnsafeKey)) {
    const error = new Error("Invalid request field");
    error.status = 400;
    return next(error);
  }
  next();
};
