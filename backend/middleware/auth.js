import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Admin from "../models/Admin.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select("-password");
      if (!req.admin) {
        res.status(401);
        throw new Error("Not authorized, admin not found");
      }
      return next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

// Like `protect`, but never rejects the request — used on public routes
// (e.g. product/category listings) that should return extra data (such as
// inactive items) when called by a logged-in admin, while still working
// normally for anonymous storefront visitors.
export const attachAdminIfPresent = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer")) {
    try {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findById(decoded.id).select("-password");
      if (admin) req.admin = admin;
    } catch {
      // Invalid/expired token on a public route — treat as anonymous.
    }
  }
  next();
};
