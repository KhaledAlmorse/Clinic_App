import { Router } from "express";
import { sql, eq } from "drizzle-orm";
import { db, invoicesTable, patientsTable, appointmentsTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get("/reports/summary", authenticate, authorize("admin", "doctor"), async (req, res): Promise<void> => {
  try {
    const revResult = await db.execute(
      sql`SELECT SUM(paid_amount) as "totalRevenue" FROM invoices`
    );
    const totalRevenue = revResult.rows[0]?.totalRevenue || 0;

    const patResult = await db.execute(
      sql`SELECT COUNT(*) as "totalPatients" FROM patients`
    );
    const totalPatients = patResult.rows[0]?.totalPatients || 0;

    const appointmentsByStatusResult = await db.execute(
      sql`SELECT status, COUNT(*) as count FROM appointments GROUP BY status`
    );
    const appointmentsByStatus = appointmentsByStatusResult.rows;

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
    const revenueByMonth = revenueByMonthResult.rows;

    res.json({
      totalRevenue: Number(totalRevenue) || 0,
      totalPatients: Number(totalPatients) || 0,
      appointmentsByStatus: appointmentsByStatus.map(r => ({ status: r.status, count: Number(r.count) })),
      revenueByMonth: revenueByMonth.map(r => ({ month: r.month, revenue: Number(r.revenue) })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
