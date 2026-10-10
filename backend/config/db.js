import mongoose from "mongoose";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async ({ shouldStop = () => false } = {}) => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is required");

  const options = {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 20,
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 0,
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
    connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000,
    socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
  };

  let attempt = 0;
  while (!shouldStop()) {
    try {
      const conn = await mongoose.connect(uri, options);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      attempt += 1;
      const delayMs = Math.min(1000 * 2 ** Math.min(attempt - 1, 5), 30000);
      console.error(
        `MongoDB connection attempt ${attempt} failed: ${error.message}. Retrying in ${Math.round(delayMs / 1000)}s.`,
      );
      await sleep(delayMs);
    }
  }

  return null;
};

export default connectDB;
