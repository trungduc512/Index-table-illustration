import { Router } from "express";
import {
  getSalesRecords,
  createSalesRecord,
  createSalesRecordViaMQ,
  getSalesRecordsByCountry,
  getSalesRecordByOrderId,
} from "./salesRecord.controller.js";

const router = Router();

router.get("/salesRecord", getSalesRecords);

router.get("/salesRecord/:id", getSalesRecordByOrderId);

router.post("/salesRecord", createSalesRecord);

router.post("/salesRecord-mq", createSalesRecordViaMQ);

router.get("/salesRecord/country/:country", getSalesRecordsByCountry);

export default router;
