import { Router } from "express";
import multer from "multer";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, visitsTable } from "@workspace/db";
import { visitAttachmentsTable } from "../../../../lib/db/src/schema/visit_attachments";
import { authenticate } from "../middlewares/authenticate";

const router = Router();
const uploadsDir = path.join(process.cwd(), "uploads");

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter });

router.post("/visits/:visitId/attachments", authenticate, upload.single("file"), async (req, res): Promise<void> => {
  const rawVisitId = Array.isArray(req.params.visitId) ? req.params.visitId[0] : req.params.visitId;
  const visitId = parseInt(rawVisitId, 10);
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
  const rawVisitId = Array.isArray(req.params.visitId) ? req.params.visitId[0] : req.params.visitId;
  const visitId = parseInt(rawVisitId, 10);
  if (isNaN(visitId)) {
    res.status(400).json({ error: "Invalid visitId" });
    return;
  }
  
  const attachments = await db.select().from(visitAttachmentsTable).where(eq(visitAttachmentsTable.visitId, visitId));
  res.json(attachments);
});

export default router;
