// seedSalesData.js
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
import SalesRecord from "./models/salesRecord.model.js";

dotenv.config();

async function run() {
  try {
    console.time("⏱️ Total seeding time"); // ⏳ Bắt đầu đếm tổng thời gian

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Xóa tất cả index hiện có (ngoại trừ _id_)
    const collection = mongoose.connection.collection("sales_records");
    // const indexes = await collection.indexes();
    // for (const idx of indexes) {
    //   if (idx.name !== "_id_") await collection.dropIndex(idx.name);
    // }

    await collection.createIndex({
      region: 1,
      country: 1,
      orderId: 1,
      totalProfit: 1,
    });

    // Xóa dữ liệu cũ để chạy lại demo
    console.log("Deleting old data...");
    await SalesRecord.deleteMany({});
    console.log("Old data deleted.");

    const countries = [
      "Vietnam",
      "Panama",
      "France",
      "Germany",
      "Thailand",
      "Brazil",
      "USA",
      "India",
      "China",
      "Japan",
      "South Korea",
      "Canada",
      "Mexico",
      "Argentina",
      "South Africa",
      "Nigeria",
      "Egypt",
      "Russia",
      "UK",
      "Italy",
      "Spain",
      "Australia",
      "New Zealand",
      "Saudi Arabia",
      "Turkey",
      "Sweden",
      "Norway",
      "Denmark",
      "Singapore",
      "Malaysia",
      "Indonesia",
      "Philippines",
      "Colombia",
      "Chile",
      "Peru",
      "Kenya",
      "Morocco",
      "Pakistan",
      "Bangladesh",
      "Poland",
      "Netherlands",
      "Belgium",
      "Switzerland",
      "Austria",
      "Greece",
      "Portugal",
      "Iceland",
      "Finland",
      "Ireland",
      "Czech Republic",
    ];

    const regions = [
      "Asia",
      "Europe",
      "Sub-Saharan Africa",
      "Middle East and North Africa",
      "Central America and the Caribbean",
      "Australia and Oceania",
      "North America",
      "South America",
      "Eastern Europe",
      "Western Europe",
      "Southeast Asia",
      "South Asia",
      "Central Asia",
      "Scandinavia",
      "Pacific Islands",
      "Middle East",
      "Northern Africa",
      "Southern Africa",
      "Caribbean",
    ];

    const itemTypes = [
      "Beverages",
      "Cosmetics",
      "Clothes",
      "Snacks",
      "Office Supplies",
      "Fruits",
      "Vegetables",
      "Cereal",
    ];
    const salesChannels = ["Online", "Offline"];
    const priorities = ["L", "M", "H", "C"];

    const totalDocs = 200_000;
    const batchSize = 25_000; // chọn từ 25-50k tùy máy
    let docs = [];

    console.log(
      `Generating and inserting ${totalDocs} documents in batches of ${batchSize}...`
    );

    let totalTime = 0;

    for (let i = 0; i < totalDocs; i++) {
      const orderDate = faker.date.between({
        from: "2015-01-01",
        to: "2015-12-31",
      });
      const shipDate = new Date(
        orderDate.getTime() + Math.random() * 10 * 86400000
      );

      const unitsSold = faker.number.int({ min: 1, max: 10000 });
      const unitPrice = faker.number.float({
        min: 10,
        max: 500,
        precision: 0.01,
      });
      const unitCost = faker.number.float({
        min: 5,
        max: unitPrice,
        precision: 0.01,
      });

      const totalRevenue = +(unitsSold * unitPrice).toFixed(2);
      const totalCost = +(unitsSold * unitCost).toFixed(2);
      const totalProfit = +(totalRevenue - totalCost).toFixed(2);

      docs.push({
        region: faker.helpers.arrayElement(regions),
        country: faker.helpers.arrayElement(countries),
        itemType: faker.helpers.arrayElement(itemTypes),
        salesChannel: faker.helpers.arrayElement(salesChannels),
        orderPriority: faker.helpers.arrayElement(priorities),
        orderDate,
        orderId: faker.number.int({ min: 100000000, max: 999999999 }),
        shipDate,
        unitsSold,
        unitPrice,
        unitCost,
        totalRevenue,
        totalCost,
        totalProfit,
      });

      if (docs.length === batchSize) {
        let batchStart = Date.now();
        await SalesRecord.insertMany(docs);
        const batchEnd = Date.now();
        const batchTime = batchEnd - batchStart;
        totalTime += batchTime;
        console.log(
          `✅ Inserted ${i + 1} documents (Batch time: ${batchTime}s)`
        );
        docs = [];
        batchStart = Date.now(); // Reset thời gian cho batch tiếp theo
      }
    }

    if (docs.length > 0) {
      await SalesRecord.insertMany(docs);
      console.log(`✅ Inserted remaining ${docs.length} documents.`);
    }

    console.log("⏱️ Total seeding time", totalTime); // 🕒 In tổng thời gian
    console.log("✅ Done inserting all random sales data!");
  } catch (err) {
    console.error("❌ Error inserting data:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

run();
