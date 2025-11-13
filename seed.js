// seedSalesData.js
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import SalesRecord from "./models/salesRecord.model.js";

const uri =
  "mongodb://root:123456@localhost:27017/eventual-index-demo?authSource=admin";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    const countries = [
      "Vietnam",
      "Panama",
      "France",
      "Germany",
      "Thailand",
      "Brazil",
      "USA",
      "India",
    ];

    const regions = [
      "Asia",
      "Europe",
      "Sub-Saharan Africa",
      "Middle East and North Africa",
      "Central America and the Caribbean",
      "Australia and Oceania",
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

    const totalDocs = 10000;
    const batchSize = 10000;
    const docs = [];

    for (let i = 0; i < totalDocs; i++) {
      const orderDate = faker.date.between("2015-01-01", "2015-12-31");
      const shipDate = new Date(
        orderDate.getTime() + Math.random() * 10 * 86400000
      );
      const unitsSold = faker.datatype.number({ min: 1, max: 10000 });
      const unitPrice = faker.datatype.number({
        min: 10,
        max: 500,
        precision: 0.01,
      });
      const unitCost = faker.datatype.number({
        min: 5,
        max: unitPrice,
        precision: 0.01,
      });

      const totalRevenue = +(unitsSold * unitPrice).toFixed(2);
      const totalCost = +(unitsSold * unitCost).toFixed(2);
      const totalProfit = +(totalRevenue - totalCost).toFixed(2);

      docs.push({
        region: faker.random.arrayElement(regions),
        country: faker.random.arrayElement(countries),
        itemType: faker.random.arrayElement(itemTypes),
        salesChannel: faker.random.arrayElement(salesChannels),
        orderPriority: faker.random.arrayElement(priorities),
        orderDate,
        orderId: faker.datatype.number({ min: 100000000, max: 999999999 }),
        shipDate,
        unitsSold,
        unitPrice,
        unitCost,
        totalRevenue,
        totalCost,
        totalProfit,
      });

      if (docs.length === batchSize) {
        await SalesRecord.insertMany(docs);
        console.log(`Inserted ${i + 1} documents...`);
        docs.length = 0;
      }
    }

    if (docs.length > 0) {
      await SalesRecord.insertMany(docs);
      console.log(`Inserted remaining ${docs.length} documents.`);
    }

    console.log("✅ Done inserting all random sales data!");
  } catch (err) {
    console.error("❌ Error inserting data:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
