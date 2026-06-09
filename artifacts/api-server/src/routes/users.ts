import { Router } from "express";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { hashPassword } from "../lib/auth";
import { z } from "zod/v4";

const router = Router();

const STAFF_ROLES = ["admin", "doctor", "receptionist"] as const;
const USER_SORT_FIELDS = ["name", "email", "role", "createdAt"] as const;

const listUsersQuerySchema = z.object({
  role: z.enum(STAFF_ROLES).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(USER_SORT_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(6),
  role: z.enum(STAFF_ROLES),
  specialty: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(STAFF_ROLES).optional(),
  specialty: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
});

function formatStaffUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    specialty: user.specialty ?? null,
    phone: user.phone ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

function buildOrder(sort: z.infer<typeof listUsersQuerySchema>["sort"], order: "asc" | "desc") {
  const column = {
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }[sort];

  return order === "asc" ? asc(column) : desc(column);
}

router.use("/users", authenticate);

router.get("/users", async (req: AuthRequest, res) => {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { role, search, page, limit, sort, order } = parsed.data;

  if (req.userRole !== "admin" && role !== "doctor") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const conditions: any[] = [inArray(usersTable.role, STAFF_ROLES)];
  if (role) {
    conditions.push(eq(usersTable.role, role));
  }
  if (search) {
    conditions.push(
      or(
        ilike(usersTable.name, `%${search}%`),
        ilike(usersTable.email, `%${search}%`),
        ilike(usersTable.phone, `%${search}%`),
        ilike(usersTable.specialty, `%${search}%`),
      )!,
    );
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * limit;
  const orderBy = buildOrder(sort, order);

  const [users, [{ count }], summaryRows] = await Promise.all([
    db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      specialty: usersTable.specialty,
      phone: usersTable.phone,
      createdAt: usersTable.createdAt,
    })
      .from(usersTable)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(whereClause),
    db.select({
      role: usersTable.role,
      count: sql<number>`count(*)`,
    })
      .from(usersTable)
      .where(whereClause)
      .groupBy(usersTable.role),
  ]);

  const summary = STAFF_ROLES.reduce<Record<(typeof STAFF_ROLES)[number], number>>((acc, roleKey) => {
    acc[roleKey] = 0;
    return acc;
  }, { admin: 0, doctor: 0, receptionist: 0 });

  for (const row of summaryRows) {
    summary[row.role as keyof typeof summary] = Number(row.count);
  }

  res.json({
    data: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
    total: Number(count),
    page,
    limit,
    summary,
  });
});

router.post("/users", authorize("admin"), async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { password, ...data } = parsed.data;
    const [user] = await db.insert(usersTable).values({
      ...data,
      passwordHash: hashPassword(password),
    }).returning();
    res.status(201).json(formatStaffUser(user));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/users/:id", authorize("admin"), async (req, res) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { password, ...data } = parsed.data;
    const updateData: Record<string, unknown> = { ...data };
    if (password) {
      updateData.passwordHash = hashPassword(password);
    }

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(formatStaffUser(user));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/users/:id", authorize("admin"), async (req, res) => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true });
});

export default router;
