import { Router, type IRouter } from "express";
import { eq, ilike, or, desc, sql, and, ne } from "drizzle-orm";
import { db, patientsTable, activityLogTable } from "@workspace/db";
import { CreatePatientBody, UpdatePatientBody, GetPatientParams, UpdatePatientParams, DeletePatientParams, ListPatientsQueryParams } from "@workspace/api-zod";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { formatZodError } from "../lib/validation";

const router: IRouter = Router();

function formatPatient(p: typeof patientsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    bloodType: p.bloodType ?? null,
    address: p.address ?? null,
    allergies: p.allergies ?? null,
    emergencyContact: p.emergencyContact ?? null,
    notes: p.notes ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/patients", authenticate, authorize("admin", "doctor", "receptionist"), async (req, res): Promise<void> => {
  const params = ListPatientsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: formatZodError(params.error) });
    return;
  }
  const { search, page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;

  let query = db.select().from(patientsTable).$dynamic();
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(patientsTable).$dynamic();

  if (search) {
    const condition = or(
      ilike(patientsTable.name, `%${search}%`),
      ilike(patientsTable.email, `%${search}%`),
      ilike(patientsTable.phone, `%${search}%`)
    );
    query = query.where(condition);
    countQuery = countQuery.where(condition);
  }

  const [patients, [{ count }]] = await Promise.all([
    query.orderBy(desc(patientsTable.createdAt)).limit(limit).offset(offset),
    countQuery,
  ]);

  res.json({ data: patients.map(formatPatient), total: Number(count), page, limit });
});

router.post("/patients", authenticate, authorize("admin", "doctor", "receptionist"), async (req, res): Promise<void> => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }

  if (parsed.data.dateOfBirth) {
    const dob = new Date(parsed.data.dateOfBirth);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    if (dob > now) {
      res.status(400).json({ error: "Birthdate cannot be in the future" });
      return;
    }
    if (age > 120) {
      res.status(400).json({ error: "Birthdate is not logical (age > 120)" });
      return;
    }
  }

  const [existing] = await db.select().from(patientsTable).where(eq(patientsTable.email, parsed.data.email));
  if (existing) {
    res.status(400).json({ error: "A patient with this email already exists" });
    return;
  }

  const [patient] = await db.insert(patientsTable).values(parsed.data).returning();
  await db.insert(activityLogTable).values({
    type: "patient_created",
    description: `New patient registered: ${patient.name}`,
    entityId: patient.id,
  });
  res.status(201).json(formatPatient(patient));
});

router.get("/patients/:id", authenticate, authorize("admin", "doctor", "receptionist"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPatientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, params.data.id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.json(formatPatient(patient));
});

router.get("/patients/by-user/:userId", authenticate, async (req: any, res): Promise<void> => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  if (req.userRole === "patient" && req.userId !== userId) {
    res.status(403).json({ error: "Forbidden: can only view own records" });
    return;
  }
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, userId));
  if (!patient) {
    res.status(404).json({ error: "Patient profile not found" });
    return;
  }
  res.json(formatPatient(patient));
});

router.patch("/patients/:id", authenticate, authorize("admin", "doctor", "receptionist"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePatientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }

  if (parsed.data.dateOfBirth) {
    const dob = new Date(parsed.data.dateOfBirth);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    if (dob > now) {
      res.status(400).json({ error: "Birthdate cannot be in the future" });
      return;
    }
    if (age > 120) {
      res.status(400).json({ error: "Birthdate is not logical (age > 120)" });
      return;
    }
  }

  if (parsed.data.email) {
    const [existing] = await db.select().from(patientsTable).where(
      and(
        eq(patientsTable.email, parsed.data.email),
        ne(patientsTable.id, params.data.id)
      )
    );
    if (existing) {
      res.status(400).json({ error: "A patient with this email already exists" });
      return;
    }
  }

  const [patient] = await db.update(patientsTable).set(parsed.data).where(eq(patientsTable.id, params.data.id)).returning();
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.json(formatPatient(patient));
});

router.delete("/patients/:id", authenticate, authorize("admin", "receptionist"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePatientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [patient] = await db.delete(patientsTable).where(eq(patientsTable.id, params.data.id)).returning();
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
