import express from "express";
import { getWishlist, toggleWishlist } from "../controllers/wishlistController.js";
import { protectUser } from "../middleware/userAuth.js";

const router = express.Router();

router.use(protectUser);
router.get("/", getWishlist);
router.post("/toggle", toggleWishlist);

export default router;
