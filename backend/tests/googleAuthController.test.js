import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { createGoogleAuthHandler } from "../controllers/googleAuthController.js";
import userAuthRoutes from "../routes/userAuthRoutes.js";
import adminAuthRoutes from "../routes/authRoutes.js";

const credential = "test-id-token-value";
const verifiedPayload = {
  sub: "google-subject-for-test-only",
  email: "Customer.Example@gmail.com",
  email_verified: true,
  name: "Customer Example",
};
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicCertificate = publicKey.export({ type: "spki", format: "pem" });
const testAudience = "test-client-id.apps.googleusercontent.com";

const signGoogleCredential = (claims = {}, signingKey = privateKey) => {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({
    iss: "https://accounts.google.com",
    aud: testAudience,
    sub: verifiedPayload.sub,
    email: verifiedPayload.email,
    email_verified: true,
    name: verifiedPayload.name,
    iat: now,
    exp: now + 300,
    ...claims,
  }, signingKey, { algorithm: "RS256", keyid: "google-test-key" });
};

const makeResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const makeHandler = ({ payload = verifiedPayload, existingUser = null, phoneOwner = null, createError = null, audience = "test-client-id", verifyError = null } = {}) => {
  const calls = { verify: [], findOne: [], create: [], token: [] };
  const googleClient = {
    async verifyIdToken(options) {
      calls.verify.push(options);
      if (verifyError) throw verifyError;
      return { getPayload: () => payload };
    },
  };
  const UserModel = {
    async findOne(query) {
      calls.findOne.push(query);
      if (query.email) return existingUser;
      if (query.phone) return phoneOwner;
      return null;
    },
    async create(data) {
      calls.create.push(data);
      if (createError) throw createError;
      return { _id: "new-customer-id", ...data };
    },
  };
  const tokenGenerator = (id) => {
    calls.token.push(id);
    return "test-session-jwt";
  };
  return {
    calls,
    handler: createGoogleAuthHandler({ googleClient, UserModel, tokenGenerator, clientId: audience }),
  };
};

const invoke = async (handler, body = { credential }) => {
  const response = makeResponse();
  let forwardedError;
  await handler({ body }, response, (error) => { forwardedError = error; });
  if (forwardedError) throw forwardedError;
  return response;
};

test("Google verification is audience-bound and invalid or expired credentials are rejected", async () => {
  const { handler, calls } = makeHandler({ verifyError: new Error("invalid or expired token") });
  const response = await invoke(handler);
  assert.equal(calls.verify[0].idToken, credential);
  assert.equal(calls.verify[0].audience, "test-client-id");
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.success, false);
  assert.equal(calls.create.length, 0);
});

test("Google's OAuth2Client validates JWT signature, issuer, audience, and expiry", async () => {
  const verifier = new OAuth2Client();
  verifier.getFederatedSignonCertsAsync = async () => ({ certs: { "google-test-key": publicCertificate }, format: "PEM" });

  const ticket = await verifier.verifyIdToken({ idToken: signGoogleCredential(), audience: testAudience });
  assert.equal(ticket.getPayload().email_verified, true);

  await assert.rejects(
    verifier.verifyIdToken({ idToken: signGoogleCredential({ exp: Math.floor(Date.now() / 1000) - 600 }), audience: testAudience }),
    /Token used too late/,
  );
  await assert.rejects(
    verifier.verifyIdToken({ idToken: signGoogleCredential({ aud: "wrong-client-id" }), audience: testAudience }),
    /Wrong recipient/,
  );
  const otherKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
  await assert.rejects(
    verifier.verifyIdToken({ idToken: signGoogleCredential({}, otherKey), audience: testAudience }),
    /Invalid token signature/,
  );
});

test("Google tokens without a verified email are rejected", async () => {
  const { handler, calls } = makeHandler({ payload: { ...verifiedPayload, email_verified: false } });
  const response = await invoke(handler);
  assert.equal(response.statusCode, 401);
  assert.equal(calls.create.length, 0);
});

test("new Google customers must provide an Indian mobile number before account creation", async () => {
  const { handler, calls } = makeHandler();
  const response = await invoke(handler);
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.code, "PHONE_REQUIRED");
  assert.equal(calls.create.length, 0);
});

test("new Google customers use the existing customer model and customer JWT response", async () => {
  const { handler, calls } = makeHandler();
  const response = await invoke(handler, { credential, phone: "9876543210" });
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.user.id, "new-customer-id");
  assert.equal(response.body.user.email, "customerexample@gmail.com");
  assert.equal(response.body.token, "test-session-jwt");
  assert.equal(calls.create[0].phone, "9876543210");
  assert.equal(calls.create[0].emailVerified, true);
  assert.notEqual(calls.create[0].password, credential);
  assert.equal("googleId" in calls.create[0], false);
  assert.equal("role" in calls.create[0], false);
  assert.equal("credential" in response.body, false);
  assert.deepEqual(calls.token, ["new-customer-id"]);
});

test("a matching verified customer can sign in but receives no automatic provider link", async () => {
  const existingUser = { _id: "existing-customer-id", name: "Existing", email: "customerexample@gmail.com", phone: "9876543210", emailVerified: true, isActive: true };
  const { handler, calls } = makeHandler({ existingUser });
  const response = await invoke(handler);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.user.id, existingUser._id);
  assert.equal(calls.create.length, 0);
  assert.deepEqual(Object.keys(existingUser).sort(), ["_id", "email", "emailVerified", "isActive", "name", "phone"]);
});

test("an unverified colliding email is not linked or authenticated", async () => {
  const existingUser = { _id: "existing-customer-id", emailVerified: false, isActive: true };
  const { handler, calls } = makeHandler({ existingUser });
  const response = await invoke(handler);
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.code, "EMAIL_NOT_VERIFIED");
  assert.equal(calls.create.length, 0);
  assert.equal(calls.token.length, 0);
});

test("a phone number already owned by another customer cannot create a duplicate account", async () => {
  const { handler, calls } = makeHandler({ phoneOwner: { _id: "other-customer-id" } });
  const response = await invoke(handler, { credential, phone: "9876543210" });
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.code, "PHONE_IN_USE");
  assert.equal(calls.create.length, 0);
});

test("concurrent email collisions return a safe conflict instead of logging duplicate-key details", async () => {
  const duplicateEmail = Object.assign(new Error("duplicate key"), { code: 11000, keyPattern: { email: 1 }, keyValue: { email: "customer@example.com" } });
  const { handler } = makeHandler({ createError: duplicateEmail });
  const response = await invoke(handler, { credential, phone: "9876543210" });
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.code, "EMAIL_IN_USE");
  assert.doesNotMatch(JSON.stringify(response.body), /customer@example\.com/);
});

test("Google sign-in fails closed when its server audience is not configured", async () => {
  const { handler, calls } = makeHandler({ audience: "" });
  const response = await invoke(handler);
  assert.equal(response.statusCode, 503);
  assert.equal(calls.verify.length, 0);
});

test("Google sign-in is registered only under customer auth, never admin auth", () => {
  const routePaths = (router) => router.stack.filter((layer) => layer.route).map((layer) => layer.route.path);
  assert.ok(routePaths(userAuthRoutes).includes("/google"));
  assert.equal(routePaths(adminAuthRoutes).includes("/google"), false);
});
