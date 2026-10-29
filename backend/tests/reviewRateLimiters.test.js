import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import ReviewSubmissionLog from "../models/ReviewSubmissionLog.js";
import { reviewSubmissionGuard } from "../middleware/reviewRateLimiters.js";

// In-memory stand-in for the log collection so the test needs no database.
let rows = [];
let nextId = 0;
const inWindow = (row, query) => String(row.user) === String(query.user) && (!query.createdAt || row.createdAt >= query.createdAt.$gte);
ReviewSubmissionLog.create = async ({ user }) => { const row = { _id: ++nextId, user, createdAt: new Date() }; rows.push(row); return row; };
ReviewSubmissionLog.countDocuments = async (query) => rows.filter((row) => inWindow(row, query)).length;
ReviewSubmissionLog.findOne = (query) => ({ sort: () => ({ lean: async () => rows.find((row) => inWindow(row, query)) }) });
ReviewSubmissionLog.deleteOne = async (query) => { rows = rows.filter((row) => row._id !== query._id); };

const createResponse = () => {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.writableEnded = false;
  res.headers = {};
  res.setHeader = (name, value) => { res.headers[name] = value; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; res.writableEnded = true; res.emit("finish"); res.emit("close"); return res; };
  return res;
};
const attempt = async (userId) => {
  const res = createResponse();
  let allowed = false;
  await reviewSubmissionGuard({ user: { _id: userId } }, res, (error) => { if (error) throw error; allowed = true; });
  return { res, allowed };
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

test("an account may save 3 reviews per hour, then receives a 429 with Retry-After", async () => {
  rows = [];
  for (let index = 0; index < 3; index += 1) {
    const { res, allowed } = await attempt("user-a");
    assert.equal(allowed, true);
    res.status(201).json({ success: true });
    await tick();
  }
  const blocked = await attempt("user-a");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.ok(Number(blocked.res.headers["Retry-After"]) > 0);
  assert.equal((await attempt("user-b")).allowed, true);
});

test("failed validation does not use up the hourly allowance", async () => {
  rows = [];
  const { res } = await attempt("user-c");
  res.status(400).json({ success: false });
  await tick();
  assert.equal(rows.length, 0);
});

test("a second request from the same account is rejected while the first is still saving", async () => {
  rows = [];
  const first = await attempt("user-d");
  const second = await attempt("user-d");
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.equal(second.res.statusCode, 409);
  first.res.status(201).json({ success: true });
  await tick();
  assert.equal((await attempt("user-d")).allowed, true);
});
