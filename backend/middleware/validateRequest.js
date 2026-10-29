import { validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const error = new Error(result.array().map(({ msg }) => msg).join(", "));
  error.status = 400;
  next(error);
};
