import SalesRecord from "../models/salesRecord.model.js";
import { connectDB } from "../config/db.config.js";

// Contract:
// - Inputs: query objects or identifiers
// - Outputs: Mongoose documents / arrays
// - Error modes: throws on DB errors

export async function getSalesRecords(query) {
  // Minimal implementation: forward query to Mongoose find
  // If no query provided, return all documents (be careful with large collections)
  const q = query && Object.keys(query).length ? query : {};
  return await SalesRecord.find(q).limit(1000);
}

export async function getSalesRecordByOrderId(id) {
  await connectDB();
  return await SalesRecord.find({ orderId: id });
}

export async function createSalesRecord(productData) {
  return await SalesRecord.create(productData);
}

export async function createSalesRecordViaMQ(productData) {
  return await SalesRecord.create(productData);
}

export async function getSalesRecordByCountry(country) {
  await connectDB();
  return await SalesRecord.find({ country: country });
}
