import express from "express";
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from "../controllers/cartController.js";
import { protectUser } from "../middleware/userAuth.js";
import { body, param } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.use(protectUser);
router.get("/", getCart);
router.post("/", body("productId").isMongoId(), body("quantity").optional().isInt({ min: 1, max: 10000 }), body("color").optional().isString().isLength({ max: 100 }), body("printingType").optional().isIn(["plain", "custom"]), body("instructions").optional().isString().isLength({ max: 2000 }), validateRequest, addToCart);
router.put("/:itemId", param("itemId").isMongoId(), body("quantity").isInt({ min: 1, max: 10000 }), validateRequest, updateCartItem);
router.delete("/:itemId", param("itemId").isMongoId(), validateRequest, removeCartItem);
router.delete("/", clearCart);

export default router;
