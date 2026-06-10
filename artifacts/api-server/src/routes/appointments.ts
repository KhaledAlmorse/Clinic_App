import { Router, type IRouter } from "express";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { db, appointmentsTable, patientsTable, usersTable, activityLogTable, notificationsTable } from "@workspace/db";
import { doctorSchedulesTable } from "../../../../lib/db/src/schema/doctor_schedules";
import {
  CreateAppointmentBody, UpdateAppointmentBody,
  GetAppointmentParams, UpdateAppointmentParams, DeleteAppointmentParams,
  ListAppointmentsQueryParams
} from "@workspace/api-zod";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { formatZodError } from "../lib/validation";

const router: IRouter = Router();

async function formatAppointment(a: typeof appointmentsTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, a.patientId));
  const [doctor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.doctorId));
  return {
    id: a.id,
    patientId: a.patientId,
    doctorId: a.doctorId,
    patientName: patient?.name ?? null,
    doctorName: doctor?.name ?? null,
    scheduledAt: a.scheduledAt.toISOString(),
    status: a.status,
    type: a.type,
    notes: a.notes ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

function buildSlotsForRange(date: Date, startTime: string, endTime: string, existingAppts: Array<{ scheduledAt: Date }>) {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const slots: string[] = [];

  let current = new Date(date);
  current.setHours(startHour, startMin, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(endHour, endMin, 0, 0);

  const slotDuration = 30 * 60 * 1000;

  while (current.getTime() + slotDuration <= endDate.getTime()) {
    const slotEnd = new Date(current.getTime() + slotDuration);
    const isConflict = existingAppts.some((appt) => {
      const apptEnd = new Date(appt.scheduledAt.getTime() + 30 * 60000);
      return current.getTime() < apptEnd.getTime() && slotEnd.getTime() > appt.scheduledAt.getTime();
    });

    if (!isConflict) {
      slots.push(current.toISOString());
    }

    current = new Date(current.getTime() + slotDuration);
  }

  return slots;
}

router.get("/appointments", authenticate, authorize("admin", "doctor", "receptionist", "patient"), async (req: AuthRequest, res): Promise<void> => {
  const qp = ListAppointmentsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: formatZodError(qp.error) });
    return;
  }
  const { date, startDate, endDate, doctorId, status, page = 1, limit = 20 } = qp.data;
  let { patientId } = qp.data;
  const offset = (page - 1) * limit;

  if (req.userRole === "patient") {
    const [pat] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.userId, req.userId!));
    if (!pat) {
      res.status(404).json({ error: "Patient profile not found" });
      return;
    }
    patientId = pat.id;
  }

  const conditions: ReturnType<typeof eq>[] = [];
  if (doctorId) conditions.push(eq(appointmentsTable.doctorId, doctorId));
  if (patientId) conditions.push(eq(appointmentsTable.patientId, patientId));
  if (status) conditions.push(eq(appointmentsTable.status, status));
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    conditions.push(gte(appointmentsTable.scheduledAt, start));
    conditions.push(lte(appointmentsTable.scheduledAt, end));
  } else if (startDate && endDate) {
    conditions.push(gte(appointmentsTable.scheduledAt, new Date(startDate)));
    conditions.push(lte(appointmentsTable.scheduledAt, new Date(endDate)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(appointmentsTable).where(whereClause).orderBy(desc(appointmentsTable.scheduledAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(appointmentsTable).where(whereClause),
  ]);

  const data = await Promise.all(rows.map(formatAppointment));
  res.json({ data, total: Number(count), page, limit });
});

router.get("/appointments/available-slots", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const doctorId = Number(req.query.doctorId);
  const dateStr = req.query.date as string;
  if (!doctorId || !dateStr) {
    res.status(400).json({ error: "Missing doctorId or date" });
    return;
  }
  const targetDate = new Date(dateStr);
  const dayOfWeek = targetDate.getDay();

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppts = await db
    .select({ scheduledAt: appointmentsTable.scheduledAt })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.doctorId, doctorId),
        gte(appointmentsTable.scheduledAt, startOfDay),
        lte(appointmentsTable.scheduledAt, endOfDay),
      ),
    );

  try {
    const [schedule] = await db
      .select()
      .from(doctorSchedulesTable)
      .where(
        and(
          eq(doctorSchedulesTable.doctorId, doctorId),
          eq(doctorSchedulesTable.dayOfWeek, dayOfWeek),
          eq(doctorSchedulesTable.isWorking, true),
        ),
      );

    if (schedule) {
      res.json(buildSlotsForRange(targetDate, schedule.startTime, schedule.endTime, existingAppts));
      return;
    }
  } catch {
    // Fall through to default clinic hours when the schedule table is unavailable.
  }

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    res.json([]);
    return;
  }

  res.json(buildSlotsForRange(targetDate, "09:00", "17:00", existingAppts));
});

router.post("/appointments", authenticate, authorize("admin", "doctor", "receptionist", "patient"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  let patientId = parsed.data.patientId;
  if (req.userRole === "patient") {
    const [pat] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.userId, req.userId!));
    if (!pat) {
      res.status(404).json({ error: "Patient profile not found" });
      return;
    }
    patientId = pat.id;
  }

  const values = {
    ...parsed.data,
    patientId,
    scheduledAt: new Date(parsed.data.scheduledAt),
  };

  if (values.scheduledAt.getTime() < Date.now()) {
    res.status(400).json({ error: "Cannot book an appointment in the past" });
    return;
  }

  const endApptTime = new Date(values.scheduledAt.getTime() + 30 * 60000);
  const startOfDay = new Date(values.scheduledAt);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(values.scheduledAt);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppts = await db.select().from(appointmentsTable).where(
    and(
      eq(appointmentsTable.doctorId, values.doctorId),
      gte(appointmentsTable.scheduledAt, startOfDay),
      lte(appointmentsTable.scheduledAt, endOfDay)
    )
  );

  const isConflict = existingAppts.some(appt => {
    if (appt.status === 'cancelled' || appt.status === 'no_show') return false;
    const apptEnd = new Date(appt.scheduledAt.getTime() + 30 * 60000);
    return values.scheduledAt.getTime() < apptEnd.getTime() && endApptTime.getTime() > appt.scheduledAt.getTime();
  });

  if (isConflict) {
    res.status(400).json({ error: "Doctor is already booked for this time slot" });
    return;
  }

  const [appt] = await db.insert(appointmentsTable).values(values).returning();
  await db.insert(activityLogTable).values({
    type: "appointment_booked",
    description: `Appointment booked for patient #${appt.patientId}`,
    entityId: appt.id,
  });

  const timeStr = appt.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = appt.scheduledAt.toLocaleDateString();
  const [patientUser] = await db.select({ userId: patientsTable.userId, name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, appt.patientId));
  const [doctor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, appt.doctorId));
  const receptionists = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, 'receptionist'));

  const notifications = [];
  if (patientUser?.userId && req.userId !== patientUser.userId) {
    notifications.push({
      userId: patientUser.userId,
      type: "appointment_booked",
      title: "Appointment Confirmed",
      message: `Your appointment with ${doctor?.name} is scheduled for ${dateStr} at ${timeStr}.`,
      entityType: "appointment",
      entityId: appt.id,
    });
  } else if (patientUser?.userId) {
    notifications.push({
      userId: patientUser.userId,
      type: "appointment_booked",
      title: "Appointment Confirmed",
      message: `Your appointment with ${doctor?.name} is scheduled for ${dateStr} at ${timeStr}.`,
      entityType: "appointment",
      entityId: appt.id,
    });
  }

  if (appt.doctorId && req.userId !== appt.doctorId) {
    notifications.push({
      userId: appt.doctorId,
      type: "appointment_booked",
      title: "New Appointment",
      message: `New appointment booked with ${patientUser?.name || 'Patient'} on ${dateStr} at ${timeStr}.`,
      entityType: "appointment",
      entityId: appt.id,
    });
  }

  for (const rec of receptionists) {
    if (req.userId !== rec.id) {
      notifications.push({
        userId: rec.id,
        type: "appointment_booked",
        title: "New Booking",
        message: `${patientUser?.name || 'Patient'} booked an appointment with ${doctor?.name} on ${dateStr} at ${timeStr}.`,
        entityType: "appointment",
        entityId: appt.id,
      });
    }
  }

  if (notifications.length > 0) {
    await db.insert(notificationsTable).values(notifications);
  }

  res.status(201).json(await formatAppointment(appt));
});

router.get("/appointments/:id", authenticate, authorize("admin", "doctor", "receptionist"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, params.data.id));
  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(await formatAppointment(appt));
});

router.patch("/appointments/:id", authenticate, authorize("admin", "doctor", "receptionist"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  
  const [existingAppt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, params.data.id));
  if (!existingAppt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  if (["confirmed", "completed", "no_show"].includes(existingAppt.status) && parsed.data.status) {
    if (req.userRole !== "admin" && req.userRole !== "receptionist") {
      res.status(403).json({ error: "Cannot edit the status of an appointment in this state" });
      return;
    }
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.scheduledAt) {
    updateData.scheduledAt = new Date(parsed.data.scheduledAt);
  }
  const [appt] = await db.update(appointmentsTable).set(updateData).where(eq(appointmentsTable.id, params.data.id)).returning();
  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  if (parsed.data.status && existingAppt.status !== parsed.data.status) {
    const timeStr = appt.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = appt.scheduledAt.toLocaleDateString();
    const [patientUser] = await db.select({ userId: patientsTable.userId, name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, appt.patientId));
    const [doctor] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, appt.doctorId));
    const receptionists = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, 'receptionist'));

    const notifications = [];
    if (patientUser?.userId && req.userId !== patientUser.userId) {
      notifications.push({
        userId: patientUser.userId,
        type: "appointment_updated",
        title: "Appointment Update",
        message: `Your appointment on ${dateStr} is now ${parsed.data.status}.`,
        entityType: "appointment",
        entityId: appt.id,
      });
    }
    if (appt.doctorId && req.userId !== appt.doctorId) {
      notifications.push({
        userId: appt.doctorId,
        type: "appointment_updated",
        title: "Appointment Update",
        message: `${patientUser?.name || 'Patient'}'s appointment on ${dateStr} is now ${parsed.data.status}.`,
        entityType: "appointment",
        entityId: appt.id,
      });
    }
    for (const rec of receptionists) {
      if (req.userId !== rec.id) {
        notifications.push({
          userId: rec.id,
          type: "appointment_updated",
          title: "Appointment Update",
          message: `${patientUser?.name || 'Patient'}'s appointment with ${doctor?.name} is now ${parsed.data.status}.`,
          entityType: "appointment",
          entityId: appt.id,
        });
      }
    }
    if (notifications.length > 0) {
      await db.insert(notificationsTable).values(notifications);
    }
  }

  res.json(await formatAppointment(appt));
});

router.delete("/appointments/:id", authenticate, authorize("admin", "receptionist"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [appt] = await db.delete(appointmentsTable).where(eq(appointmentsTable.id, params.data.id)).returning();
  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
