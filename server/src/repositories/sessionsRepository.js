import { and, eq } from "drizzle-orm";
import { sessions, users } from "../db/schema.js";

export async function findSessionWithUserById(db, sessionId) {
  const rows = await db
    .select({
      sessionId: sessions.id,
      sessionUserId: sessions.userId,
      expiresAt: sessions.expiresAt,
      lastSeenAt: sessions.lastSeenAt,
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
      profilePhotoUrl: users.profilePhotoUrl,
      preferredContactsJson: users.preferredContactsJson,
      bio: users.bio,
      isUcsdVerified: users.isUcsdVerified,
      ucsdEmail: users.ucsdEmail,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertSession(db, session) {
  const rows = await db.insert(sessions).values(session).returning();
  return rows[0] ?? null;
}

export async function touchSession(db, sessionId, lastSeenAt) {
  await db.update(sessions).set({ lastSeenAt }).where(eq(sessions.id, sessionId));
}

export async function deleteSessionById(db, sessionId) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function deleteSessionByIdAndUserId(db, sessionId, userId) {
  await db.delete(sessions).where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
}
