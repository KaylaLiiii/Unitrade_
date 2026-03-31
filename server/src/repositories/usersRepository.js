import { eq } from "drizzle-orm";
import { users } from "../db/schema.js";

export async function findUserById(db, userId) {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ?? null;
}

export async function findUserByEmail(db, email) {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function insertUser(db, user) {
  const rows = await db.insert(users).values(user).returning();
  return rows[0] ?? null;
}

export async function updateUserById(db, userId, updates) {
  const rows = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
  return rows[0] ?? null;
}
