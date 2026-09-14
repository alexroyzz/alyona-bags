import crypto from "crypto";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/sendEmail.js";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes
const createVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
};

// @desc    Register a new customer
// @route   POST /api/users/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, phone } = req.body;

  // Required fields
  if (!name || !email || !password || !confirmPassword || !phone) {
    res.status(400);
    throw new Error("All fields are required");
  }

  // Password match validation
  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  // Phone validation (Indian mobile number)
  const phoneRegex = /^[6-9]\d{9}$/;

  if (!phoneRegex.test(phone.trim())) {
    res.status(400);
    throw new Error("Please enter a valid 10-digit mobile number");
  }

  // Check existing email
  const existing = await User.findOne({
    email: email.trim().toLowerCase(),
  });

  if (existing) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  // Check existing phone number
  const phoneExists = await User.findOne({
    phone: phone.trim(),
  });

  if (phoneExists) {
    res.status(400);
    throw new Error("This phone number is already registered");
  }

  const { token, tokenHash } = createVerificationToken();

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    phone: phone.trim(),
    emailVerified: false,
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  });

  await sendVerificationEmail(user, token);

  res.status(201).json({
    success: true,
    message:
      "Account created. Please check your email to verify your address before logging in.",
    email: user.email,
  });
});

// @desc    Verify a user's email via the token from their verification link
// @route   POST /api/users/verify-email
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.status(400);
    throw new Error("Verification token is required");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

  if (!user) {
    res.status(400);
    throw new Error("Invalid or already-used verification link");
  }
  if (
    user.emailVerificationExpires &&
    user.emailVerificationExpires < new Date()
  ) {
    res.status(400);
    throw new Error(
      "This verification link has expired. Please request a new one.",
    );
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = "";
  user.emailVerificationExpires = null;
  await user.save();

  sendWelcomeEmail(user).catch(() => {});

  res.json({
    success: true,
    message: "Email verified successfully. You can now log in.",
  });
});
// @desc    Send password reset email
// @route   POST /api/users/forgot-password

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  });

  // Security: Don't reveal whether account exists
  if (!user) {
    return res.json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  }

  const { token, tokenHash } = createVerificationToken();

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await user.save();

  await sendPasswordResetEmail(user, token);

  res.json({
    success: true,
    message:
      "If an account exists with this email, a password reset link has been sent.",
  });
});
// @desc    Reset Password
// @route   POST /api/users/reset-password

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    res.status(400);
    throw new Error("All fields are required");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
  }).select("+passwordResetTokenHash +passwordResetExpires");

  if (!user) {
    res.status(400);
    throw new Error("Invalid password reset link");
  }

  if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
    res.status(400);
    throw new Error("Password reset link has expired");
  }

  user.password = password;

  user.passwordResetTokenHash = "";
  user.passwordResetExpires = null;

  await user.save();

  res.json({
    success: true,
    message:
      "Password updated successfully. Please login with your new password.",
  });
});
// @desc    Resend the email verification link
// @route   POST /api/users/resend-verification
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Don't reveal whether the account exists — respond the same either way.
  if (!user || user.emailVerified) {
    res.json({
      success: true,
      message:
        "If an unverified account exists for that email, a new link has been sent.",
    });
    return;
  }

  const { token, tokenHash } = createVerificationToken();
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpires = new Date(
    Date.now() + EMAIL_VERIFICATION_TTL_MS,
  );
  await user.save();

  await sendVerificationEmail(user, token);

  res.json({
    success: true,
    message:
      "If an unverified account exists for that email, a new link has been sent.",
  });
});

// @desc    Login customer
// @route   POST /api/users/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.emailVerified) {
    res.status(403);
    throw new Error("Please verify your email before logging in.");
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    token: generateToken(user._id),
  });
});

// @desc    Get current customer profile
// @route   GET /api/users/me
export const getMyProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @desc    Update profile (name/phone)
// @route   PUT /api/users/me
export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, phone } = req.body;
  if (name) user.name = name;
  if (phone !== undefined) {
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone.trim())) {
      res.status(400);
      throw new Error("Please enter a valid 10-digit mobile number");
    }

    const existingPhone = await User.findOne({
      phone: phone.trim(),
      _id: { $ne: req.user._id },
    });

    if (existingPhone) {
      res.status(400);
      throw new Error("Phone number is already in use");
    }

    user.phone = phone.trim();
  }
  await user.save();
  res.json({ success: true, user });
});

// @desc    Add / update a shipping address
// @route   POST /api/users/me/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const {
    label,
    fullName,
    phone,
    line1,
    line2,
    city,
    state,
    pincode,
    country,
    isDefault,
  } = req.body;

  if (isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push({
    label,
    fullName,
    phone,
    line1,
    line2,
    city,
    state,
    pincode,
    country,
    isDefault: !!isDefault,
  });
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
});

// @desc    Edit an existing address
// @route   PUT /api/users/me/addresses/:addressId
export const editAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  const {
    label,
    fullName,
    phone,
    line1,
    line2,
    city,
    state,
    pincode,
    country,
    isDefault,
  } = req.body;
  if (label !== undefined) address.label = label;
  if (fullName !== undefined) address.fullName = fullName;
  if (phone !== undefined) address.phone = phone;
  if (line1 !== undefined) address.line1 = line1;
  if (line2 !== undefined) address.line2 = line2;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (pincode !== undefined) address.pincode = pincode;
  if (country !== undefined) address.country = country;

  if (isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  }

  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// @desc    Set an address as the default
// @route   PATCH /api/users/me/addresses/:addressId/default
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  user.addresses.forEach(
    (a) => (a.isDefault = a._id.toString() === req.params.addressId),
  );
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

// @desc    Delete an address
// @route   DELETE /api/users/me/addresses/:addressId
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(
    (a) => a._id.toString() !== req.params.addressId,
  );
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});
