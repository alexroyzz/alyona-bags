import crypto from "node:crypto";
import asyncHandler from "express-async-handler";
import { OAuth2Client } from "google-auth-library";
import validator from "validator";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const PHONE_PATTERN = /^[6-9]\d{9}$/;
const googleClient = new OAuth2Client();

const jsonError = (res, status, message, code) => res.status(status).json({
  success: false,
  message,
  ...(code ? { code } : {}),
});

const authResponse = (res, user, tokenGenerator, status = 200) => res.status(status).json({
  success: true,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  },
  token: tokenGenerator(user._id),
});

export const createGoogleAuthHandler = ({
  googleClient: verifier,
  UserModel,
  tokenGenerator,
  clientId,
}) => asyncHandler(async (req, res) => {
  const audience = typeof clientId === "function" ? clientId() : clientId;
  if (!audience?.trim()) {
    return jsonError(res, 503, "Google sign-in is not configured on this server.");
  }

  let payload;
  try {
    const ticket = await verifier.verifyIdToken({
      idToken: req.body.credential,
      audience: audience.trim(),
    });
    payload = ticket.getPayload();
  } catch {
    return jsonError(res, 401, "Google sign-in could not be verified. Please try again.");
  }

  if (
    !payload ||
    payload.email_verified !== true ||
    typeof payload.email !== "string" ||
    typeof payload.sub !== "string" ||
    !payload.sub
  ) {
    return jsonError(res, 401, "Google sign-in requires a verified Google email address.");
  }

  const rawEmail = payload.email.trim().toLowerCase();
  const email = validator.normalizeEmail(rawEmail) || rawEmail;
  if (!email) return jsonError(res, 401, "Google sign-in could not be verified. Please try again.");

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    if (!existingUser.isActive) {
      return jsonError(res, 403, "This customer account is unavailable. Please contact support.");
    }
    if (!existingUser.emailVerified) {
      return jsonError(
        res,
        409,
        "This email already has an unverified Alyona Bags account. Sign in with your password and verify the email before using Google sign-in.",
        "EMAIL_NOT_VERIFIED",
      );
    }
    // A verified Google email can authenticate the same verified customer email.
    // No Google subject or ID token is persisted or linked to the account.
    return authResponse(res, existingUser, tokenGenerator);
  }

  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
  if (!phone) {
    return jsonError(
      res,
      409,
      "Enter your mobile number to finish creating your customer account.",
      "PHONE_REQUIRED",
    );
  }
  if (!PHONE_PATTERN.test(phone)) {
    return jsonError(res, 400, "Please enter a valid 10-digit mobile number.", "INVALID_PHONE");
  }

  const phoneOwner = await UserModel.findOne({ phone });
  if (phoneOwner) {
    return jsonError(
      res,
      409,
      "That mobile number is already associated with an account. Sign in to that account or use a different number.",
      "PHONE_IN_USE",
    );
  }

  const name = (typeof payload.name === "string" && payload.name.trim())
    || email.split("@")[0];

  try {
    const user = await UserModel.create({
      name: name.slice(0, 120),
      email,
      phone,
      // Google-only customers can set a password later through the existing reset flow.
      password: crypto.randomBytes(48).toString("base64url"),
      emailVerified: true,
    });
    return authResponse(res, user, tokenGenerator, 201);
  } catch (error) {
    if (error?.code !== 11000) throw error;

    // Reconcile concurrent registrations without linking by unverified client data.
    const racedUser = await UserModel.findOne({ email });
    if (racedUser) {
      if (!racedUser.isActive) {
        return jsonError(res, 403, "This customer account is unavailable. Please contact support.");
      }
      if (racedUser.emailVerified) return authResponse(res, racedUser, tokenGenerator);
      return jsonError(res, 409, "This email already has an unverified Alyona Bags account. Sign in with your password and verify the email before using Google sign-in.", "EMAIL_NOT_VERIFIED");
    }
    if (error.keyPattern?.phone || error.keyValue?.phone) {
      return jsonError(res, 409, "That mobile number is already associated with an account. Sign in to that account or use a different number.", "PHONE_IN_USE");
    }
    if (error.keyPattern?.email || error.keyValue?.email) {
      return jsonError(res, 409, "An account with this verified email already exists. Sign in with the existing account.", "EMAIL_IN_USE");
    }
    throw error;
  }
});

export const googleLoginUser = createGoogleAuthHandler({
  googleClient,
  UserModel: User,
  tokenGenerator: generateToken,
  clientId: () => process.env.GOOGLE_CLIENT_ID,
});
