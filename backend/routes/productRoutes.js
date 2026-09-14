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

const router = express.Router();

router.get("/", attachAdminIfPresent, getProducts);
router.get("/:slug", getProductBySlug);
router.post("/", protect, upload.array("images", 8), createProduct);
router.put("/:id", protect, upload.array("images", 8), updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
