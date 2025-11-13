import mongoose from "mongoose";

const salesRecordSchema = new mongoose.Schema(
  {
    region: { type: String, required: true },
    country: { type: String, required: true },
    itemType: { type: String, required: true },
    salesChannel: { type: String, required: true },
    orderPriority: { type: String, required: true },
    orderDate: { type: Date, required: true },
    orderId: { type: Number, required: true },
    shipDate: { type: Date, required: true },
    unitsSold: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    totalRevenue: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    totalProfit: { type: Number, required: true },
  },
  { collection: "sales_records" }
);

salesRecordSchema.index({ region: 1, country: 1 });

export default mongoose.model("SalesRecord", salesRecordSchema);
