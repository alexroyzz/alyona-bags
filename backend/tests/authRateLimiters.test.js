import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import {
  authRateLimiters,
  createAuthRateLimiters,
  DEFAULT_AUTH_RATE_LIMIT_POLICY,
} from "../middleware/authRateLimiters.js";
import userAuthRoutes from "../routes/userAuthRoutes.js";
import adminAuthRoutes from "../routes/authRoutes.js";

class MockResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.headersSent = false;
    this.writableEnded = false;
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = String(value);
  }

  append(name, value) {
    const key = name.toLowerCase();
    this.headers[key] = this.headers[key] ? `${this.headers[key]}, ${value}` : String(value);
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(body) {
    this.body = body;
    this.headersSent = true;
    this.writableEnded = true;
    this.emit("finish");
    return this;
  }

  send(body) {
    this.body = body;
    this.headersSent = true;
    this.writableEnded = true;
    this.emit("finish");
    return this;
  }
}

const request = (path, body = {}) => ({
  body,
  headers: {},
  ip: "203.0.113.12",
  method: "POST",
  originalUrl: path,
  path,
  app: { get: (key) => key === "trust proxy" ? false : undefined },
  socket: { remoteAddress: "203.0.113.12" },
});

const runRequest = async (middlewares, path, body = {}, statusCode = 401) => {
  const req = request(path, body);
  const res = new MockResponse();
  const finish = () => res.status(statusCode).json({ success: statusCode < 400 });

  const dispatch = async (index) => {
    if (index >= middlewares.length) return finish();
    let nextCalled = false;
    let nextPromise;
    const next = (error) => {
      nextCalled = true;
      if (error) {
        nextPromise = Promise.reject(error);
        return nextPromise;
      }
      nextPromise = dispatch(index + 1);
      return nextPromise;
    };
    await middlewares[index](req, res, next);
    if (nextCalled) await nextPromise;
  };

  await dispatch(0);
  // express-rate-limit releases successful requests on the response finish event.
  await new Promise((resolve) => setImmediate(resolve));
  return res;
};

const customerLogin = (limiters) => [limiters.customerLogin.ip, limiters.customerLogin.account];
const findRoute = (router, path, method) => router.stack
  .find((layer) => layer.route?.path === path && layer.route.methods[method])?.route;

test("auth route defaults allow 10 failed attempts with separate stricter reset limits", () => {
  assert.equal(DEFAULT_AUTH_RATE_LIMIT_POLICY.windowMs, 15 * 60 * 1000);
  assert.equal(DEFAULT_AUTH_RATE_LIMIT_POLICY.loginIpLimit, 10);
  assert.equal(DEFAULT_AUTH_RATE_LIMIT_POLICY.loginAccountLimit, 10);
  assert.equal(DEFAULT_AUTH_RATE_LIMIT_POLICY.googleLoginLimit, 10);
  assert.equal(DEFAULT_AUTH_RATE_LIMIT_POLICY.passwordResetLimit, 5);
  assert.equal(DEFAULT_AUTH_RATE_LIMIT_POLICY.resendVerificationLimit, 5);
});

test("authentication middleware is limited only on its intended routes", () => {
  const customerLoginRoute = findRoute(userAuthRoutes, "/login", "post");
  assert.equal(customerLoginRoute.stack[0].handle, authRateLimiters.customerLogin.ip);
  assert.equal(customerLoginRoute.stack[1].handle, authRateLimiters.customerLogin.account);
  assert.equal(findRoute(userAuthRoutes, "/google", "post").stack[0].handle, authRateLimiters.googleLogin);
  assert.equal(findRoute(userAuthRoutes, "/forgot-password", "post").stack[0].handle, authRateLimiters.forgotPassword);
  assert.equal(findRoute(userAuthRoutes, "/me", "get").stack[0].handle.name, "asyncUtilWrap");

  const adminLoginRoute = findRoute(adminAuthRoutes, "/login", "post");
  assert.equal(adminLoginRoute.stack[0].handle, authRateLimiters.adminLogin.ip);
  assert.equal(adminLoginRoute.stack[1].handle, authRateLimiters.adminLogin.account);
  assert.equal(findRoute(adminAuthRoutes, "/me", "get").stack[0].handle.name, "asyncUtilWrap");
});

test("customer sign-in permits 10 failed attempts, skips successful logins, then returns 429 with retry duration", async () => {
  const limiters = createAuthRateLimiters({ windowMs: 15_000 });
  const success = await runRequest(customerLogin(limiters), "/customer-login", { email: "buyer@example.com" }, 200);
  assert.equal(success.statusCode, 200, "the first legitimate login should work");

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const response = await runRequest(customerLogin(limiters), "/customer-login", { email: "buyer@example.com" });
    assert.equal(response.statusCode, 401, `failed attempt ${attempt} should be allowed`);
  }

  const limited = await runRequest(customerLogin(limiters), "/customer-login", { email: "buyer@example.com" });
  assert.equal(limited.statusCode, 429);
  assert.ok(Number(limited.headers["retry-after"]) > 0);
  assert.equal(limited.body.retryAfterSeconds, Number(limited.headers["retry-after"]));
  assert.match(limited.body.message, /try again in/i);
});

test("separate account, admin, and Google counters prevent unrelated login buckets from consuming one another", async () => {
  const limiters = createAuthRateLimiters({ windowMs: 15_000, loginIpLimit: 10, loginAccountLimit: 5, googleLoginLimit: 5 });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await runRequest(customerLogin(limiters), "/customer-login", { email: "first@example.com" });
    assert.equal(response.statusCode, 401);
  }

  const otherAccount = await runRequest(customerLogin(limiters), "/customer-login", { email: "second@example.com" });
  assert.equal(otherAccount.statusCode, 401, "another email has its own account failure bucket");

  const firstAccountLimited = await runRequest(customerLogin(limiters), "/customer-login", { email: "first@example.com" });
  assert.equal(firstAccountLimited.statusCode, 429);

  const googleSuccess = await runRequest([limiters.googleLogin], "/google-login", {}, 200);
  assert.equal(googleSuccess.statusCode, 200, "Google sign-in can succeed independently");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const googleAttempt = await runRequest([limiters.googleLogin], "/google-login");
    assert.equal(googleAttempt.statusCode, 401, "Google sign-in has an independent endpoint bucket");
  }
  const googleLimited = await runRequest([limiters.googleLogin], "/google-login");
  assert.equal(googleLimited.statusCode, 429);

  const adminAttempt = await runRequest([
    limiters.adminLogin.ip,
    limiters.adminLogin.account,
  ], "/admin-login", { email: "admin@example.com" });
  assert.equal(adminAttempt.statusCode, 401, "admin sign-in has a separate bucket");
});

test("expired authentication windows allow a new attempt", async () => {
  const limiters = createAuthRateLimiters({ windowMs: 100, loginIpLimit: 5, loginAccountLimit: 5 });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await runRequest(customerLogin(limiters), "/customer-login", { email: "buyer@example.com" });
    assert.equal(response.statusCode, 401);
  }
  const limited = await runRequest(customerLogin(limiters), "/customer-login", { email: "buyer@example.com" });
  assert.equal(limited.statusCode, 429);

  await new Promise((resolve) => setTimeout(resolve, 130));
  const retry = await runRequest(customerLogin(limiters), "/customer-login", { email: "buyer@example.com" });
  assert.equal(retry.statusCode, 401);
});

test("forgot-password requests, reset attempts, and verification resends have isolated counters", async () => {
  const limiters = createAuthRateLimiters({ windowMs: 15_000, passwordResetLimit: 2, resendVerificationLimit: 1 });
  const forgot = [limiters.forgotPassword];
  const reset = [limiters.resetPassword];
  const resend = [limiters.resendVerification];

  assert.equal((await runRequest(forgot, "/forgot-password", {}, 200)).statusCode, 200);
  assert.equal((await runRequest(reset, "/reset-password", {}, 400)).statusCode, 400);
  assert.equal((await runRequest(forgot, "/forgot-password", {}, 200)).statusCode, 200);
  assert.equal((await runRequest(forgot, "/forgot-password", {}, 200)).statusCode, 429);
  assert.equal((await runRequest(reset, "/reset-password", {}, 400)).statusCode, 400);
  assert.equal((await runRequest(reset, "/reset-password", {}, 400)).statusCode, 429);
  assert.equal((await runRequest(resend, "/resend-verification", {}, 200)).statusCode, 200);
  assert.equal((await runRequest(resend, "/resend-verification", {}, 200)).statusCode, 429);
});

