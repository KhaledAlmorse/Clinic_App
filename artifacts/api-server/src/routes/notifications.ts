import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";

const router: IRouter = Router();

router.get("/notifications", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const [rows, [{ count }]] = await Promise.all([
    db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, req.userId!))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50),
    db.select({ count: sql<number>`count(*)` }).from(notificationsTable)
      .where(eq(notificationsTable.userId, req.userId!)),
  ]);

  res.json({
    data: rows.map(n => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      entityType: n.entityType,
      entityId: n.entityId,
      createdAt: n.createdAt.toISOString(),
    })),
    total: Number(count),
  });
});

router.patch("/notifications/:id/read", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [notification] = await db.update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({ success: true });
});

router.get("/notifications/unread-count", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.userId, req.userId!),
        eq(notificationsTable.read, false)
      )
    );

  res.json({ count: Number(count) });
});

export default router;
