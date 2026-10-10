import express from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, attachAdminIfPresent } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { cachePublic } from "../middleware/cache.js";
import { body, param } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";
import { mongoInputGuard } from "../middleware/mongoInputGuard.js";
import { protectUser } from "../middleware/userAuth.js";
import { getProductReviews, createProductReview } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/", attachAdminIfPresent, cachePublic, getProducts);
router.get("/:slug/reviews", getProductReviews);
router.post(
  "/:slug/reviews",
  protectUser,
  mongoInputGuard,
  param("slug").isString().isLength({ min: 1, max: 240 }),
  body("rating").isInt({ min: 1, max: 5 }).toInt(),
  body("title").isString().trim().isLength({ min: 2, max: 100 }),
  body("comment").isString().trim().isLength({ min: 5, max: 1500 }),
  validateRequest,
  createProductReview,
);
router.get("/:slug", attachAdminIfPresent, cachePublic, getProductBySlug);
const validateProduct = [
  body("name").optional().isString().trim().isLength({ min: 1, max: 160 }),
  body("category").optional().isMongoId(),
  body("description").optional().isString().isLength({ max: 12000 }),
  body("material").optional().isString().isLength({ max: 200 }),
  body("sku").optional().isString().isLength({ max: 100 }),
  body("stockStatus").optional().isIn(["in_stock", "limited", "out_of_stock"]),
  ...["price", "discountPrice", "stockQuantity", "moq"].map((field) =>
    body(field).optional({ values: "falsy" }).isNumeric().toFloat().isFloat({ min: 0 }),
  ),
  ...["isActive", "isFeatured", "allowCustomPrint"].map((field) =>
    body(field).optional().custom((value) => [true, false, "true", "false"].includes(value)),
  ),
  validateRequest,
];
const validateId = [param("id").isMongoId(), validateRequest];

router.post("/", protect, upload.array("images", 8), mongoInputGuard, validateProduct, createProduct);
router.put("/:id", protect, upload.array("images", 8), mongoInputGuard, validateId, validateProduct, updateProduct);
router.delete("/:id", protect, validateId, deleteProduct);

export default router;
