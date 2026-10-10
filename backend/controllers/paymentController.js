import asyncHandler from "express-async-handler";
import Razorpay from "razorpay";
import crypto from "crypto";

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured on the server");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// @desc    Create a Razorpay order for a given amount (called before checkout confirmation)
// @route   POST /api/payment/razorpay/order
// @access  Private (User)
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body; // amount in INR (rupees)

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error("A valid amount is required");
  }

  const instance = getRazorpayInstance();
  const order = await instance.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// @desc    Verify Razorpay payment signature after checkout completes on the client
// Exported as a helper so orderController can call it directly during order creation.
export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
};
