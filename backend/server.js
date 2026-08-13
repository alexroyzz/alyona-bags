import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import userAuthRoutes from "./routes/userAuthRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import aboutRoutes from "./routes/aboutRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();

/* =========================
   CORS
========================= */

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

/* =========================
   BODY PARSERS
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   LOGGER
========================= */

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Alyona Bags API is running",
  });
});

/* =========================
   API ROUTES
========================= */

app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/users", userAuthRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/coupons", couponRoutes);

/* =========================
   SERVE REACT FRONTEND
========================= */

const frontendPath = path.join(__dirname, "frontend/dist");

app.use(express.static(frontendPath));

/*
  React Router fallback.
  Any non-API route will serve React's index.html.
*/
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(frontendPath, "index.html"), (err) => {
    if (err) {
      next(err);
    }
  });
});

/* =========================
   ERROR HANDLERS
========================= */

app.use(notFound);
app.use(errorHandler);

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`,
  );
});
