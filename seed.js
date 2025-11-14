import mongoose from "mongoose";
import dotenv from "dotenv";
import SalesRecord from "./models/salesRecord.model.js";
import { createSalesRecord } from "./data/salesRecordData.js";
import fs from "fs";

dotenv.config();

const indexConfig = JSON.parse(
  fs.readFileSync(new URL("./indexConfig.json", import.meta.url), "utf-8")
);

async function seedDatabase(
  uri,
  indexFields,
  totalDocs = 100000,
  batchSize = 10000
) {
  const conn = await mongoose.createConnection(uri).asPromise();
  const Sales = conn.model("SalesRecord", SalesRecord.schema, "sales_records");

  // Reset DB
  await Sales.deleteMany({});
  console.log(`[${uri}] Old data deleted`);

  // Tạo index nếu có
  if (indexFields.length > 0) {
    const indexObj = {};
    indexFields.forEach((f) => (indexObj[f] = 1));
    await conn.collection("sales_records").createIndex(indexObj);
    console.log(`[${uri}] Index created:`, indexObj);
  }

  // Insert data
  let docs = [];
  let batchTimes = []; // ⬅ Lưu thời gian mỗi batch
  let totalTime = 0;

  for (let i = 0; i < totalDocs; i++) {
    docs.push(createSalesRecord());

    if (docs.length === batchSize) {
      const start = Date.now();
      await Sales.insertMany(docs);
      const batchTime = Date.now() - start;
      totalTime += batchTime;
      batchTimes.push(batchTime); // ⬅ lưu thời gian batch
      console.log(
        `[${uri}] Inserted batch of ${docs.length} docs in ${batchTime} ms`
      );
      docs = [];
    }
  }

  if (docs.length > 0) {
    const start = Date.now();
    await Sales.insertMany(docs);
    const batchTime = Date.now() - start;
    totalTime += batchTime;
    batchTimes.push(batchTime);
    console.log(
      `[${uri}] Inserted final batch of ${docs.length} docs in ${batchTime} ms`
    );
  }

  await conn.close();
  console.log(`[${uri}] Seed finished in total time: ${totalTime} ms`);

  return batchTimes; // Trả về mảng thời gian từng batch
}

async function run() {
  const metrics = {};

  for (const [key, fields] of Object.entries(indexConfig)) {
    const uri =
      key === "withIndex"
        ? process.env.MONGO_URI_WITH_INDEX
        : process.env.MONGO_URI_NO_INDEX;

    console.log(`\n⏱️ Seeding ${key}...`);
    const batchTimes = await seedDatabase(uri, fields);
    metrics[key] = batchTimes; // Lưu mảng batch times
  }

  fs.writeFileSync("benchmarks.json", JSON.stringify(metrics, null, 2));
  console.log("✅ benchmarks.json updated with batch times");
}

run();
