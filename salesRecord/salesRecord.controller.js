import * as SalesRecordService from "./salesRecord.service.js";

export async function getSalesRecords(req, res) {
  try {
    const result = await SalesRecordService.getSalesRecords(req.query);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function createSalesRecord(req, res) {
  try {
    const result = await SalesRecordService.createSalesRecord(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function createSalesRecordViaMQ(req, res) {
  try {
    const result = await SalesRecordService.createSalesRecordViaMQ(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getSalesRecordsByCountry(req, res) {
  try {
    const result = await SalesRecordService.getSalesRecordByCountry(
      req.params.country
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getSalesRecordByOrderId(req, res) {
  try {
    const result = await SalesRecordService.getSalesRecordByOrderId(
      req.params.id
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
