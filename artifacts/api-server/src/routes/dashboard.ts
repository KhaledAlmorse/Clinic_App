import { Router, type IRouter } from "express";
import { eq, gte, lte, and, desc, sql } from "drizzle-orm";
import { db, patientsTable, appointmentsTable, invoicesTable, activityLogTable, usersTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router: IRouter = Router();

router.get("/dashboard/stats", authenticate, authorize("admin", "doctor", "receptionist"), async (_req, res): Promise<void> => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    [{ totalPatients }],
    [{ totalAppointments }],
    [{ todayAppointments }],
    [{ completedAppointments }],
    [{ cancelledAppointments }],
    [{ pendingInvoices }],
    [{ totalRevenue }],
    [{ newPatientsThisMonth }],
  ] = await Promise.all([
    db.select({ totalPatients: sql<number>`count(*)` }).from(patientsTable),
    db.select({ totalAppointments: sql<number>`count(*)` }).from(appointmentsTable),
    db.select({ todayAppointments: sql<number>`count(*)` }).from(appointmentsTable)
      .where(and(gte(appointmentsTable.scheduledAt, todayStart), lte(appointmentsTable.scheduledAt, todayEnd))),
    db.select({ completedAppointments: sql<number>`count(*)` }).from(appointmentsTable)
      .where(eq(appointmentsTable.status, "completed")),
    db.select({ cancelledAppointments: sql<number>`count(*)` }).from(appointmentsTable)
      .where(eq(appointmentsTable.status, "cancelled")),
    db.select({ pendingInvoices: sql<number>`count(*)` }).from(invoicesTable)
      .where(eq(invoicesTable.status, "pending")),
    db.select({ totalRevenue: sql<number>`coalesce(sum(paid_amount), 0)` }).from(invoicesTable),
    db.select({ newPatientsThisMonth: sql<number>`count(*)` }).from(patientsTable)
      .where(gte(patientsTable.createdAt, monthStart)),
  ]);

  res.json({
    totalPatients: Number(totalPatients),
    totalAppointments: Number(totalAppointments),
    todayAppointments: Number(todayAppointments),
    completedAppointments: Number(completedAppointments),
    cancelledAppointments: Number(cancelledAppointments),
    pendingInvoices: Number(pendingInvoices),
    totalRevenue: Number(totalRevenue),
    newPatientsThisMonth: Number(newPatientsThisMonth),
  });
});

router.get("/dashboard/appointments-today", authenticate, authorize("admin", "doctor", "receptionist"), async (_req, res): Promise<void> => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const rows = await db.select().from(appointmentsTable)
    .where(and(gte(appointmentsTable.scheduledAt, todayStart), lte(appointmentsTable.scheduledAt, todayEnd)))
    .orderBy(appointmentsTable.scheduledAt);

  const data = await Promise.all(rows.map(async (a) => {
    const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, a.patientId));
    const [doctor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.doctorId));
    return {
      id: a.id,
      patientId: a.patientId,
      doctorId: a.doctorId,
      patientName: patient?.name ?? null,
      doctorName: doctor?.name ?? null,
      scheduledAt: a.scheduledAt.toISOString(),
      duration: a.duration,
      status: a.status,
      type: a.type,
      notes: a.notes ?? null,
      createdAt: a.createdAt.toISOString(),
    };
  }));
  res.json(data);
});

router.get("/dashboard/revenue", authenticate, authorize("admin", "doctor", "receptionist"), async (req, res): Promise<void> => {
  const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const rows = await db.select({
    month: sql<string>`to_char(created_at, 'YYYY-MM')`,
    revenue: sql<number>`coalesce(sum(paid_amount), 0)`,
    invoiceCount: sql<number>`count(*)`,
  })
    .from(invoicesTable)
    .where(and(gte(invoicesTable.createdAt, start), lte(invoicesTable.createdAt, end)))
    .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

  res.json(rows.map(r => ({
    month: r.month,
    revenue: Number(r.revenue),
    invoiceCount: Number(r.invoiceCount),
  })));
});

router.get("/dashboard/recent-activity", authenticate, authorize("admin", "doctor", "receptionist"), async (_req, res): Promise<void> => {
  const rows = await db.select().from(activityLogTable).orderBy(desc(activityLogTable.createdAt)).limit(20);
  res.json(rows.map(r => ({
    id: r.id,
    type: r.type,
    description: r.description,
    entityId: r.entityId ?? null,
    createdAt: r.createdAt.toISOString(),
  })));
});

export default router;
