import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { settingsTable } from "../../../../lib/db/src/schema/settings";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get("/settings", authenticate, async (req, res) => {
  const [settings] = await db.select().from(settingsTable).limit(1);
  if (!settings) {
    const [inserted] = await db.insert(settingsTable).values({}).returning();
    res.json(inserted);
    return;
  }
  res.json(settings);
});

router.put("/settings", authenticate, authorize("admin"), async (req, res) => {
  const [existing] = await db.select().from(settingsTable).limit(1);
  if (!existing) {
    const [inserted] = await db.insert(settingsTable).values(req.body).returning();
    res.json(inserted);
    return;
  }
  const [updated] = await db.update(settingsTable).set(req.body).where(eq(settingsTable.id, existing.id)).returning();
  res.json(updated);
});

export default router;
