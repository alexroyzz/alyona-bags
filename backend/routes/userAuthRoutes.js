import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMyProfile,
  updateMyProfile,
  addAddress,
  editAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/userAuthController.js";
import { protectUser } from "../middleware/userAuth.js";


const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);
router.get("/me", protectUser, getMyProfile);
router.put("/me", protectUser, updateMyProfile);

router.post("/me/addresses", protectUser, addAddress);
router.put("/me/addresses/:addressId", protectUser, editAddress);
router.patch(
  "/me/addresses/:addressId/default",
  protectUser,
  setDefaultAddress,
);
router.delete("/me/addresses/:addressId", protectUser, deleteAddress);

export default router;
