import express from "express";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, attachAdminIfPresent } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { cachePublic } from "../middleware/cache.js";
import { body, param } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";
import { mongoInputGuard } from "../middleware/mongoInputGuard.js";

const router = express.Router();

router.get("/", attachAdminIfPresent, cachePublic, getCategories);
router.get("/:slug", attachAdminIfPresent, cachePublic, getCategoryBySlug);
const validateCategory = [
  body("name").optional().isString().trim().isLength({ min: 1, max: 100 }),
  body("description").optional().isString().isLength({ max: 2000 }),
  body("isActive").optional().custom((value) => [true, false, "true", "false"].includes(value)),
  validateRequest,
];
const validateId = [param("id").isMongoId(), validateRequest];

router.post("/", protect, upload.single("image"), mongoInputGuard, validateCategory, createCategory);
router.put("/:id", protect, upload.single("image"), mongoInputGuard, validateId, validateCategory, updateCategory);
router.delete("/:id", protect, validateId, deleteCategory);

export default router;
