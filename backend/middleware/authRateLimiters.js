import { createHmac, randomBytes } from "node:crypto";
import "../config/loadEnv.js";
import validator from "validator";
import { rateLimit } from "express-rate-limit";

export const DEFAULT_AUTH_RATE_LIMIT_POLICY = Object.freeze({
  windowMs: 15 * 60 * 1000,
  loginIpLimit: 10,
  loginAccountLimit: 10,
  googleLoginLimit: 10,
  registrationLimit: 10,
  verificationLimit: 10,
  resendVerificationLimit: 5,
  passwordResetLimit: 5,
});

const AUTH_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || DEFAULT_AUTH_RATE_LIMIT_POLICY.windowMs;
const accountKeySecret = randomBytes(32);

const getRetryAfterSeconds = (req, fallbackWindowMs) => {
  const resetTime = req.rateLimit?.resetTime;
  if (!(resetTime instanceof Date)) return Math.max(1, Math.ceil(fallbackWindowMs / 1000));
  return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
};

export const createRateLimitHandler = (message, fallbackWindowMs) => (req, res) => {
  const retryAfterSeconds = getRetryAfterSeconds(req, fallbackWindowMs);
  const retryDuration = retryAfterSeconds < 60
    ? `${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}`
    : `${Math.ceil(retryAfterSeconds / 60)} minute${retryAfterSeconds >= 120 ? "s" : ""}`;
  res.setHeader("Retry-After", String(retryAfterSeconds));
  res.status(429).json({
    success: false,
    message: `${message} Please try again in ${retryDuration}.`,
    retryAfterSeconds,
  });
};

const normalizeEmail = (value) => {
  if (typeof value !== "string") return "";
  return validator.normalizeEmail(value.trim()) || "";
};

const accountKey = (req) => {
  const email = normalizeEmail(req.body?.email);
  return `email:${createHmac("sha256", accountKeySecret).update(email).digest("hex")}`;
};

const accountEmailMissing = (req) => !normalizeEmail(req.body?.email);

const createLimiter = ({ windowMs, limit, label, skipSuccessfulRequests = false, keyGenerator, skip }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests,
  ...(keyGenerator ? { keyGenerator, validate: { keyGeneratorIpFallback: false } } : {}),
  ...(skip ? { skip } : {}),
  handler: createRateLimitHandler(`Too many ${label}.`, windowMs),
});

export const createAuthRateLimiters = ({
  windowMs = AUTH_WINDOW_MS,
  loginIpLimit = DEFAULT_AUTH_RATE_LIMIT_POLICY.loginIpLimit,
  loginAccountLimit = DEFAULT_AUTH_RATE_LIMIT_POLICY.loginAccountLimit,
  googleLoginLimit = DEFAULT_AUTH_RATE_LIMIT_POLICY.googleLoginLimit,
  registrationLimit = DEFAULT_AUTH_RATE_LIMIT_POLICY.registrationLimit,
  verificationLimit = DEFAULT_AUTH_RATE_LIMIT_POLICY.verificationLimit,
  resendVerificationLimit = DEFAULT_AUTH_RATE_LIMIT_POLICY.resendVerificationLimit,
  passwordResetLimit = DEFAULT_AUTH_RATE_LIMIT_POLICY.passwordResetLimit,
} = {}) => {
  const loginPair = (label) => ({
    ip: createLimiter({ windowMs, limit: loginIpLimit, label, skipSuccessfulRequests: true }),
    account: createLimiter({
      windowMs,
      limit: loginAccountLimit,
      label,
      skipSuccessfulRequests: true,
      keyGenerator: accountKey,
      skip: accountEmailMissing,
    }),
  });

  return {
    customerLogin: loginPair("customer sign-in attempts"),
    adminLogin: loginPair("admin sign-in attempts"),
    googleLogin: createLimiter({
      windowMs,
      limit: googleLoginLimit,
      label: "Google sign-in attempts",
      skipSuccessfulRequests: true,
    }),
    registration: createLimiter({ windowMs, limit: registrationLimit, label: "registration requests" }),
    emailVerification: createLimiter({ windowMs, limit: verificationLimit, label: "email verification attempts" }),
    resendVerification: createLimiter({ windowMs, limit: resendVerificationLimit, label: "verification email requests" }),
    forgotPassword: createLimiter({ windowMs, limit: passwordResetLimit, label: "password reset requests" }),
    resetPassword: createLimiter({ windowMs, limit: passwordResetLimit, label: "password reset attempts" }),
  };
};

export const authRateLimiters = createAuthRateLimiters();

