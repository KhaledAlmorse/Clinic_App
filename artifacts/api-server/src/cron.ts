import cron from "node-cron";
import nodemailer from "nodemailer";
import { db, appointmentsTable, patientsTable, usersTable, notificationsTable } from "@workspace/db";
import { and, gte, lte, eq } from "drizzle-orm";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "clinic@example.com",
    pass: process.env.SMTP_PASS || "password123",
  },
});

export function initCronJobs() {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Running appointment reminder job...");
    const now = new Date();
    const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    tomorrowStart.setMinutes(0, 0, 0);
    const tomorrowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    tomorrowEnd.setMinutes(59, 59, 999);

    const upcomingAppts = await db.select()
      .from(appointmentsTable)
      .where(and(
        eq(appointmentsTable.status, "scheduled"),
        gte(appointmentsTable.scheduledAt, tomorrowStart),
        lte(appointmentsTable.scheduledAt, tomorrowEnd)
      ));

    for (const appt of upcomingAppts) {
      const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, appt.patientId));
      if (!patient || !patient.userId) continue;

      const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, appt.doctorId));
      if (!doctor) continue;

      const timeStr = appt.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Create notification in DB
      await db.insert(notificationsTable).values({
        userId: patient.userId,
        type: "appointment_reminder",
        title: "Upcoming Appointment",
        message: `Reminder: You have an appointment with ${doctor.name} tomorrow at ${timeStr}.`,
        entityType: "appointment",
        entityId: appt.id,
      });

      // Send Email
      if (patient.email && process.env.SMTP_USER) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: patient.email,
            subject: "Appointment Reminder",
            text: `Dear ${patient.name},\n\nThis is a reminder for your appointment with ${doctor.name} tomorrow at ${timeStr}.\n\nThank you,\nClinicDesk`,
          });
          console.log(`[Cron] Reminder email sent to ${patient.email}`);
        } catch (e) {
          console.error(`[Cron] Failed to send email to ${patient.email}:`, e);
        }
      }
    }
  });
}
