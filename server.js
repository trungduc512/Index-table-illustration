import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedSalesData } from "./seed.js";
import cors from "cors";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"));

app.use(express.json());

// API để bắt đầu seed
app.post("/seed", async (req, res) => {
  const { totalDocs = 20000, batchSize = 2000 } = req.body;
  console.log(
    `🚀 Seeding both DBs: ${totalDocs} docs, batch size ${batchSize}`
  );

  // Indexed DB
  seedSalesData(io, totalDocs, batchSize, true).catch((err) =>
    io.emit("error", { message: err.message })
  );
  // Non-indexed DB
  seedSalesData(io, totalDocs, batchSize, false).catch((err) =>
    io.emit("error", { message: err.message })
  );

  res.json({ message: "Seeding started for both DBs!" });
});

// Lắng nghe kết nối WebSocket
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);
  socket.on("disconnect", () =>
    console.log("🔴 Client disconnected:", socket.id)
  );
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
