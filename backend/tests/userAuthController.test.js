import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { loginUser } from "../controllers/userAuthController.js";

const makeResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("email/password customer login keeps its existing verified-user JWT response", async () => {
  const originalFindOne = User.findOne;
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-only-jwt-secret-not-for-production";
  User.findOne = () => ({
    select: async () => ({
      _id: "password-customer-id",
      name: "Password Customer",
      email: "customer@example.com",
      phone: "9876543210",
      emailVerified: true,
      matchPassword: async (password) => password === "correct-password",
    }),
  });

  try {
    const response = makeResponse();
    let forwardedError;
    await loginUser({ body: { email: "customer@example.com", password: "correct-password" } }, response, (error) => { forwardedError = error; });
    if (forwardedError) throw forwardedError;

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.deepEqual(response.body.user, {
      id: "password-customer-id",
      name: "Password Customer",
      email: "customer@example.com",
      phone: "9876543210",
    });
    assert.equal(jwt.verify(response.body.token, process.env.JWT_SECRET).id, "password-customer-id");
  } finally {
    User.findOne = originalFindOne;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});
