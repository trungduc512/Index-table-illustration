// db/db.config.js
import mongoose from "mongoose";

const MONGO_URI =
  "mongodb://root:123456@localhost:27017/eventual-index-demo?authSource=admin";

/**
 * Kết nối MongoDB (dùng chung cho các service)
 */
export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
    });
    console.log("✅ Đã kết nối MongoDB thành công!");
  } catch (err) {
    console.error("❌ Lỗi kết nối MongoDB:", err.message);
    throw err;
  }
}

/**
 * Ngắt kết nối MongoDB
 */
export async function disconnectDB() {
  await mongoose.disconnect();
  console.log("Đã ngắt kết nối MongoDB.");
}

export { mongoose };
