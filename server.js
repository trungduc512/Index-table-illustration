import express from "express";
import dotenv from "dotenv";
import seedRoutes from "./routes/seed.routes.js";
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/seed", seedRoutes);

app.listen(3000, () => {
  console.log("🚀 API running on port 3000");
});
