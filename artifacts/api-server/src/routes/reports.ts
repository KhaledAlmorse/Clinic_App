import { Router } from "express";
import { sql, eq } from "drizzle-orm";
import { db, invoicesTable, patientsTable, appointmentsTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get("/reports/summary", authenticate, authorize("admin", "doctor"), async (req, res): Promise<void> => {
  try {
    const [[{ totalRevenue }]] = await db.execute(
      sql`SELECT SUM(paid_amount) as "totalRevenue" FROM invoices`
    );

    const [[{ totalPatients }]] = await db.execute(
      sql`SELECT COUNT(*) as "totalPatients" FROM patients`
    );

    const appointmentsByStatus = await db.execute(
      sql`SELECT status, COUNT(*) as count FROM appointments GROUP BY status`
    );

    const revenueByMonthResult = await db.execute(
      sql`
        SELECT 
          to_char(issued_at, 'Mon YYYY') as month,
          SUM(paid_amount) as revenue
        FROM invoices
        WHERE issued_at >= NOW() - INTERVAL '6 months'
        GROUP BY 1
        ORDER BY MIN(issued_at) ASC
      `
    );

    res.json({
      totalRevenue: Number(totalRevenue) || 0,
      totalPatients: Number(totalPatients) || 0,
      appointmentsByStatus: appointmentsByStatus.map(r => ({ status: r.status, count: Number(r.count) })),
      revenueByMonth: revenueByMonthResult.map(r => ({ month: r.month, revenue: Number(r.revenue) })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
