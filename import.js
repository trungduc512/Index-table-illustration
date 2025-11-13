import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import SalesRecord from "./models/salesRecord.model.js";

const MONGO_URI =
  "mongodb://root:123456@localhost:27017/eventual-index-demo?authSource=admin";
const CSV_FILE_PATH = "./100000 Sales Records.csv";
const BATCH_SIZE = 10000;

async function importCSV() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB via Mongoose.");

    let batch = [];

    const stream = fs
      .createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on("data", async (row) => {
        const record = {
          region: row.Region,
          country: row.Country,
          itemType: row["Item Type"],
          salesChannel: row["Sales Channel"],
          orderPriority: row["Order Priority"],
          orderDate: new Date(row["Order Date"]),
          orderId: Number(row["Order ID"]), // chỉ lưu để tham chiếu
          shipDate: new Date(row["Ship Date"]),
          unitsSold: Number(row["Units Sold"]),
          unitPrice: Number(row["Unit Price"]),
          unitCost: Number(row["Unit Cost"]),
          totalRevenue: Number(row["Total Revenue"]),
          totalCost: Number(row["Total Cost"]),
          totalProfit: Number(row["Total Profit"]),
        };

        batch.push(record);

        if (batch.length === BATCH_SIZE) {
          stream.pause();
          await SalesRecord.insertMany(batch);
          console.log(`Inserted ${batch.length} documents.`);
          batch = [];
          stream.resume();
        }
      })
      .on("end", async () => {
        if (batch.length > 0) {
          await SalesRecord.insertMany(batch);
          console.log(`Inserted final ${batch.length} documents.`);
        }
        console.log("✅ CSV file successfully processed.");
        await mongoose.disconnect();
      })
      .on("error", async (error) => {
        console.error("Error processing CSV:", error);
        await mongoose.disconnect();
      });
  } catch (err) {
    console.error("An error occurred:", err);
    await mongoose.disconnect();
  }
}

importCSV();
