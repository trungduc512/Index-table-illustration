// server.js
import express from "express";
import bodyParser from "body-parser";
import salesRecordRoutes from "./salesRecord/salesRecord.route.js";

const app = express();
app.use(bodyParser.json());

app.use("/api", salesRecordRoutes);

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
