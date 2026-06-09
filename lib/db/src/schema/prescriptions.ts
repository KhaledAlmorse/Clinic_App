import { pgTable, text, serial, timestamp, integer, jsonb, date } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { usersTable } from "./users";
import { visitsTable } from "./visits";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const prescriptionsTable = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patientsTable.id).notNull(),
  doctorId: integer("doctor_id").references(() => usersTable.id).notNull(),
  visitId: integer("visit_id").references(() => visitsTable.id),
  medications: jsonb("medications").notNull().default([]),
  notes: text("notes"),
  issuedAt: date("issued_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptionsTable.$inferSelect;
