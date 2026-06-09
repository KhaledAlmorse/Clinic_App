import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, visitsTable, patientsTable, usersTable, activityLogTable } from "@workspace/db";
import {
  CreateVisitBody, UpdateVisitBody, GetVisitParams, UpdateVisitParams, ListVisitsQueryParams
} from "@workspace/api-zod";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { formatZodError } from "../lib/validation";

const router: IRouter = Router();

async function formatVisit(v: typeof visitsTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, v.patientId));
  const [doctor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, v.doctorId));
  return {
    id: v.id,
    patientId: v.patientId,
    doctorId: v.doctorId,
    appointmentId: v.appointmentId ?? null,
    patientName: patient?.name ?? null,
    doctorName: doctor?.name ?? null,
    visitDate: v.visitDate,
    chiefComplaint: v.chiefComplaint ?? null,
    diagnosis: v.diagnosis ?? null,
    examinationNotes: v.examinationNotes ?? null,
    labResults: v.labResults ?? null,
    treatmentPlan: v.treatmentPlan ?? null,
    followUpDate: v.followUpDate ?? null,
    createdAt: v.createdAt.toISOString(),
  };
}

router.get("/visits", authenticate, authorize("admin", "doctor", "receptionist"), async (req, res): Promise<void> => {
  const qp = ListVisitsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: formatZodError(qp.error) });
    return;
  }
  const { patientId, doctorId, page = 1, limit = 20 } = qp.data;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (patientId) conditions.push(eq(visitsTable.patientId, patientId));
  if (doctorId) conditions.push(eq(visitsTable.doctorId, doctorId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(visitsTable).where(whereClause).orderBy(desc(visitsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(visitsTable).where(whereClause),
  ]);

  const data = await Promise.all(rows.map(formatVisit));
  res.json({ data, total: Number(count), page, limit });
});

router.post("/visits", authenticate, authorize("admin", "doctor"), async (req, res): Promise<void> => {
  const parsed = CreateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [visit] = await db.insert(visitsTable).values(parsed.data).returning();
  await db.insert(activityLogTable).values({
    type: "visit_recorded",
    description: `Medical visit recorded for patient #${visit.patientId}`,
    entityId: visit.id,
  });
  res.status(201).json(await formatVisit(visit));
});

router.get("/visits/:id", authenticate, authorize("admin", "doctor", "receptionist"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetVisitParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [visit] = await db.select().from(visitsTable).where(eq(visitsTable.id, params.data.id));
  if (!visit) {
    res.status(404).json({ error: "Visit not found" });
    return;
  }
  res.json(await formatVisit(visit));
});

router.patch("/visits/:id", authenticate, authorize("admin", "doctor"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateVisitParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [visit] = await db.update(visitsTable).set(parsed.data).where(eq(visitsTable.id, params.data.id)).returning();
  if (!visit) {
    res.status(404).json({ error: "Visit not found" });
    return;
  }
  res.json(await formatVisit(visit));
});

export default router;
