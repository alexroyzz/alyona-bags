import assert from "node:assert/strict";
import test from "node:test";
import Product from "../models/Product.js";
import {
  getWholesaleOnlyCheckoutMessage,
  getWholesaleOnlyProducts,
  isOnlinePaymentEnabled,
} from "../utils/onlinePayment.js";

test("online payment defaults to enabled for new and legacy-shaped products", () => {
  const product = new Product({
    name: "Everyday Canvas Tote",
    category: "507f1f77bcf86cd799439011",
    material: "Cotton Canvas",
    description: "A reusable canvas tote.",
  });

  assert.equal(product.onlinePaymentEnabled, true);
  assert.equal(isOnlinePaymentEnabled({ name: "Legacy product" }), true);
  assert.equal(isOnlinePaymentEnabled({ onlinePaymentEnabled: true }), true);
  assert.equal(isOnlinePaymentEnabled({ onlinePaymentEnabled: false }), false);
});

test("wholesale-only detection handles mixed carts and uses product data", () => {
  const products = [
    { _id: "retail", name: "Retail tote", onlinePaymentEnabled: true },
    { _id: "wholesale", name: "Bulk tote", onlinePaymentEnabled: false },
  ];

  assert.deepEqual(
    getWholesaleOnlyProducts(products.map((product) => ({ product }))).map((product) => product.name),
    ["Bulk tote"],
  );
  assert.equal(
    getWholesaleOnlyCheckoutMessage(products.map((product) => ({ product }))),
    "Online checkout is unavailable for wholesale-only product: Bulk tote. Please enquire for wholesale pricing.",
  );
  assert.equal(
    getWholesaleOnlyCheckoutMessage([{ product: { name: "Old product" } }]),
    "",
  );
});
