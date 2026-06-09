import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, prescriptionsTable, patientsTable, usersTable, activityLogTable } from "@workspace/db";
import {
  CreatePrescriptionBody, UpdatePrescriptionBody, GetPrescriptionParams,
  UpdatePrescriptionParams, DeletePrescriptionParams, ListPrescriptionsQueryParams
} from "@workspace/api-zod";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { formatZodError } from "../lib/validation";

const router: IRouter = Router();

async function formatPrescription(p: typeof prescriptionsTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, p.patientId));
  const [doctor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, p.doctorId));
  return {
    id: p.id,
    patientId: p.patientId,
    doctorId: p.doctorId,
    visitId: p.visitId ?? null,
    patientName: patient?.name ?? null,
    doctorName: doctor?.name ?? null,
    medications: p.medications as Array<{ name: string; dosage: string; frequency: string; duration: string; instructions?: string }>,
    notes: p.notes ?? null,
    issuedAt: p.issuedAt,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/prescriptions", authenticate, authorize("admin", "doctor", "receptionist", "patient"), async (req: AuthRequest, res): Promise<void> => {
  const qp = ListPrescriptionsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: formatZodError(qp.error) });
    return;
  }
  const { patientId: requestedPatientId, visitId, page = 1, limit = 20 } = qp.data;
  const offset = (page - 1) * limit;
  let patientId = requestedPatientId;

  if (req.userRole === "patient") {
    const [patientProfile] = await db
      .select({ id: patientsTable.id })
      .from(patientsTable)
      .where(eq(patientsTable.userId, req.userId!));

    if (!patientProfile) {
      res.status(404).json({ error: "Patient profile not found" });
      return;
    }

    if (requestedPatientId && requestedPatientId !== patientProfile.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    patientId = patientProfile.id;
  }

  const conditions: ReturnType<typeof eq>[] = [];
  if (patientId) conditions.push(eq(prescriptionsTable.patientId, patientId));
  if (visitId) conditions.push(eq(prescriptionsTable.visitId, visitId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(prescriptionsTable).where(whereClause).orderBy(desc(prescriptionsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(prescriptionsTable).where(whereClause),
  ]);

  const data = await Promise.all(rows.map(formatPrescription));
  res.json({ data, total: Number(count), page, limit });
});

router.post("/prescriptions", authenticate, authorize("admin", "doctor"), async (req, res): Promise<void> => {
  const parsed = CreatePrescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [prescription] = await db.insert(prescriptionsTable).values({
    ...parsed.data,
    medications: parsed.data.medications,
  }).returning();
  await db.insert(activityLogTable).values({
    type: "prescription_issued",
    description: `Prescription issued for patient #${prescription.patientId}`,
    entityId: prescription.id,
  });
  res.status(201).json(await formatPrescription(prescription));
});

router.get("/prescriptions/:id", authenticate, authorize("admin", "doctor", "receptionist", "patient"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPrescriptionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [prescription] = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, params.data.id));
  if (!prescription) {
    res.status(404).json({ error: "Prescription not found" });
    return;
  }
  if (req.userRole === "patient") {
    const [patientProfile] = await db
      .select({ id: patientsTable.id })
      .from(patientsTable)
      .where(eq(patientsTable.userId, req.userId!));

    if (!patientProfile) {
      res.status(404).json({ error: "Patient profile not found" });
      return;
    }

    if (prescription.patientId !== patientProfile.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }
  res.json(await formatPrescription(prescription));
});

router.patch("/prescriptions/:id", authenticate, authorize("admin", "doctor"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePrescriptionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdatePrescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [prescription] = await db.update(prescriptionsTable).set(parsed.data).where(eq(prescriptionsTable.id, params.data.id)).returning();
  if (!prescription) {
    res.status(404).json({ error: "Prescription not found" });
    return;
  }
  res.json(await formatPrescription(prescription));
});

router.delete("/prescriptions/:id", authenticate, authorize("admin", "doctor"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePrescriptionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [prescription] = await db.delete(prescriptionsTable).where(eq(prescriptionsTable.id, params.data.id)).returning();
  if (!prescription) {
    res.status(404).json({ error: "Prescription not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
