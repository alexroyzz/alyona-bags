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
import { googleLoginUser } from "../controllers/googleAuthController.js";
import { protectUser } from "../middleware/userAuth.js";
import { body, param } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";
import { authRateLimiters } from "../middleware/authRateLimiters.js";


const router = express.Router();

const emailField = body("email").isEmail().withMessage("A valid email is required").normalizeEmail();
const passwordField = (field = "password") => body(field).isString().isLength({ min: 6, max: 128 });
const addressFields = [
  body("fullName").optional().isString().isLength({ min: 1, max: 120 }),
  body("phone").optional().matches(/^[6-9]\d{9}$/),
  body("line1").optional().isString().isLength({ min: 1, max: 250 }),
  body("line2").optional().isString().isLength({ max: 250 }),
  ...["label", "city", "state", "country"].map((field) => body(field).optional().isString().isLength({ max: 100 })),
  body("pincode").optional().isString().isLength({ min: 4, max: 12 }),
  body("isDefault").optional().isBoolean(),
];

router.post("/register", authRateLimiters.registration, body("name").isString().trim().isLength({ min: 1, max: 120 }), emailField, passwordField(), body("confirmPassword").isString().isLength({ min: 6, max: 128 }), body("phone").matches(/^[6-9]\d{9}$/), validateRequest, registerUser);
router.post("/verify-email", authRateLimiters.emailVerification, body("token").isHexadecimal().isLength({ min: 64, max: 64 }), validateRequest, verifyEmail);
router.post("/resend-verification", authRateLimiters.resendVerification, emailField, validateRequest, resendVerificationEmail);
router.post("/login", authRateLimiters.customerLogin.ip, authRateLimiters.customerLogin.account, emailField, body("password").isString().isLength({ min: 1, max: 128 }), validateRequest, loginUser);
router.post(
  "/google",
  authRateLimiters.googleLogin,
  body("credential").isString().isLength({ min: 1, max: 8192 }).withMessage("Google credential is required"),
  body("phone").optional({ checkFalsy: true }).isString().matches(/^[6-9]\d{9}$/).withMessage("Please enter a valid 10-digit mobile number"),
  validateRequest,
  googleLoginUser,
);
router.post("/forgot-password", authRateLimiters.forgotPassword, emailField, validateRequest, forgotPassword);

router.post("/reset-password", authRateLimiters.resetPassword, body("token").isHexadecimal().isLength({ min: 64, max: 64 }), passwordField(), body("confirmPassword").isString().isLength({ min: 6, max: 128 }), validateRequest, resetPassword);
router.get("/me", protectUser, getMyProfile);
router.put("/me", protectUser, body("name").optional().isString().trim().isLength({ min: 1, max: 120 }), body("phone").optional().matches(/^[6-9]\d{9}$/), validateRequest, updateMyProfile);

router.post("/me/addresses", protectUser, ...addressFields, validateRequest, addAddress);
router.put("/me/addresses/:addressId", protectUser, param("addressId").isMongoId(), ...addressFields, validateRequest, editAddress);
router.patch(
  "/me/addresses/:addressId/default",
  protectUser,
  param("addressId").isMongoId(),
  validateRequest,
  setDefaultAddress,
);
router.delete("/me/addresses/:addressId", protectUser, param("addressId").isMongoId(), validateRequest, deleteAddress);

export default router;
