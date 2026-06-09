import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, visitAttachmentsTable, visitsTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/visits/:visitId/attachments", authenticate, upload.single("file"), async (req, res): Promise<void> => {
  const visitId = parseInt(req.params.visitId, 10);
  if (isNaN(visitId)) {
    res.status(400).json({ error: "Invalid visitId" });
    return;
  }
  
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  
  // Verify visit exists and user has access (simplified for now)
  const [visit] = await db.select().from(visitsTable).where(eq(visitsTable.id, visitId));
  if (!visit) {
    res.status(404).json({ error: "Visit not found" });
    return;
  }
  
  const [attachment] = await db.insert(visitAttachmentsTable).values({
    visitId: visitId,
    fileName: req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`,
    fileType: req.file.mimetype,
  }).returning();
  
  res.status(201).json(attachment);
});

router.get("/visits/:visitId/attachments", authenticate, async (req, res): Promise<void> => {
  const visitId = parseInt(req.params.visitId, 10);
  if (isNaN(visitId)) {
    res.status(400).json({ error: "Invalid visitId" });
    return;
  }
  
  const attachments = await db.select().from(visitAttachmentsTable).where(eq(visitAttachmentsTable.visitId, visitId));
  res.json(attachments);
});

export default router;
