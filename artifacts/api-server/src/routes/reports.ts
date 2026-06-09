import { Router } from "express";
import { sql } from "drizzle-orm";
import { db, invoicesTable, patientsTable, appointmentsTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.use("/reports", authenticate, authorize("admin", "doctor"));

router.get("/reports/revenue", async (req, res) => {
  const revenue = await db.select({
    total: sql<number>`sum(CAST(${invoicesTable.totalAmount} AS NUMERIC))`,
    paid: sql<number>`sum(CAST(${invoicesTable.paidAmount} AS NUMERIC))`
  }).from(invoicesTable);
  res.json(revenue[0]);
});

router.get("/reports/patients", async (req, res) => {
  const stats = await db.select({
    count: sql<number>`count(${patientsTable.id})`
  }).from(patientsTable);
  res.json(stats[0]);
});

router.get("/reports/appointments", async (req, res) => {
  const stats = await db.select({
    status: appointmentsTable.status,
    count: sql<number>`count(${appointmentsTable.id})`
  }).from(appointmentsTable).groupBy(appointmentsTable.status);
  res.json(stats);
});

export default router;
