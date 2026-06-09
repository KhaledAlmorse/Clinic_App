import { pgTable, text, serial, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { visitsTable } from "./visits";

export const visitAttachmentsTable = pgTable("visit_attachments", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").references(() => visitsTable.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 100 }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVisitAttachmentSchema = createInsertSchema(visitAttachmentsTable).omit({ id: true, uploadedAt: true });
export type InsertVisitAttachment = z.infer<typeof insertVisitAttachmentSchema>;
export type VisitAttachment = typeof visitAttachmentsTable.$inferSelect;
