import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, invoicesTable, patientsTable, activityLogTable } from "@workspace/db";
import {
  CreateInvoiceBody, UpdateInvoiceBody, GetInvoiceParams,
  UpdateInvoiceParams, ListInvoicesQueryParams, RecordPaymentBody, RecordPaymentParams
} from "@workspace/api-zod";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { formatZodError } from "../lib/validation";

const router: IRouter = Router();

type InvoiceItem = { description: string; quantity: number; unitPrice: number; total: number };

function formatInvoice(inv: typeof invoicesTable.$inferSelect, patientName?: string | null) {
  return {
    id: inv.id,
    patientId: inv.patientId,
    visitId: inv.visitId ?? null,
    patientName: patientName ?? null,
    totalAmount: Number(inv.totalAmount),
    paidAmount: Number(inv.paidAmount),
    status: inv.status,
    items: inv.items as InvoiceItem[],
    notes: inv.notes ?? null,
    issuedAt: inv.issuedAt,
    dueDate: inv.dueDate ?? null,
    createdAt: inv.createdAt.toISOString(),
  };
}

async function getWithPatient(inv: typeof invoicesTable.$inferSelect) {
  const [patient] = await db.select({ name: patientsTable.name }).from(patientsTable).where(eq(patientsTable.id, inv.patientId));
  return formatInvoice(inv, patient?.name);
}

router.get("/invoices", authenticate, authorize("admin", "receptionist"), async (req, res): Promise<void> => {
  const qp = ListInvoicesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: formatZodError(qp.error) });
    return;
  }
  const { patientId, status, page = 1, limit = 20 } = qp.data;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (patientId) conditions.push(eq(invoicesTable.patientId, patientId));
  if (status) conditions.push(eq(invoicesTable.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(invoicesTable).where(whereClause).orderBy(desc(invoicesTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(invoicesTable).where(whereClause),
  ]);

  const data = await Promise.all(rows.map(getWithPatient));
  res.json({ data, total: Number(count), page, limit });
});

router.post("/invoices", authenticate, authorize("admin", "receptionist"), async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const items = parsed.data.items as InvoiceItem[];
  const totalAmount = items.reduce((sum: number, item: InvoiceItem) => sum + item.total, 0).toFixed(2);
  const [invoice] = await db.insert(invoicesTable).values({
    ...parsed.data,
    items: items,
    totalAmount,
    paidAmount: "0",
    status: "pending",
  }).returning();
  await db.insert(activityLogTable).values({
    type: "invoice_created",
    description: `Invoice created for patient #${invoice.patientId} - $${totalAmount}`,
    entityId: invoice.id,
  });
  res.status(201).json(await getWithPatient(invoice));
});

router.get("/invoices/:id", authenticate, authorize("admin", "receptionist"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetInvoiceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(await getWithPatient(invoice));
});

router.patch("/invoices/:id", authenticate, authorize("admin", "receptionist"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateInvoiceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.items) {
    const items = parsed.data.items as InvoiceItem[];
    updateData.totalAmount = items.reduce((sum: number, item: InvoiceItem) => sum + item.total, 0).toFixed(2);
  }
  const [invoice] = await db.update(invoicesTable).set(updateData).where(eq(invoicesTable.id, params.data.id)).returning();
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(await getWithPatient(invoice));
});

router.post("/invoices/:id/pay", authenticate, authorize("admin", "receptionist"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RecordPaymentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = RecordPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const [existing] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const newPaid = Number(existing.paidAmount) + parsed.data.amount;
  const total = Number(existing.totalAmount);
  const newStatus = newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "pending";

  const [invoice] = await db.update(invoicesTable)
    .set({ paidAmount: newPaid.toFixed(2), status: newStatus })
    .where(eq(invoicesTable.id, params.data.id))
    .returning();

  await db.insert(activityLogTable).values({
    type: "payment_recorded",
    description: `Payment of $${parsed.data.amount} recorded for invoice #${invoice.id}`,
    entityId: invoice.id,
  });

  res.json(await getWithPatient(invoice));
});

export default router;
