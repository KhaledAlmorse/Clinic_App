import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { hashPassword } from "../lib/auth";

const router = Router();

router.use("/users", authenticate);

router.get("/users", async (req, res) => {
  if (req.query.role === "doctor") {
    // allow anyone authenticated to list doctors
  } else if (req.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  
  const query = req.query.role ? eq(usersTable.role, req.query.role as string) : undefined;
  
  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    specialty: usersTable.specialty,
    phone: usersTable.phone,
    createdAt: usersTable.createdAt
  }).from(usersTable).where(query);
  res.json(users);
});

router.post("/users", authorize("admin"), async (req, res) => {
  try {
    const data = req.body;
    if (data.password) {
      data.passwordHash = hashPassword(data.password);
      delete data.password;
    }
    const [user] = await db.insert(usersTable).values(data).returning();
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/users/:id", authorize("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    if (data.password) {
      data.passwordHash = hashPassword(data.password);
      delete data.password;
    }
    const [user] = await db.update(usersTable).set(data).where(eq(usersTable.id, id)).returning();
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/users/:id", authorize("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true });
});

export default router;
