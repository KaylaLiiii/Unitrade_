import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { conversations, listings, ucsdVerifications, users } from "../db/schema.js";

export async function findVerificationByUserId(db, userId) {
  const rows = await db
    .select()
    .from(ucsdVerifications)
    .where(eq(ucsdVerifications.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

export async function upsertVerificationByUserId(db, userId, values) {
  const rows = await db
    .insert(ucsdVerifications)
    .values({
      id: values.id ?? crypto.randomUUID(),
      userId,
      ...values,
    })
    .onConflictDoUpdate({
      target: ucsdVerifications.userId,
      set: {
        email: values.email,
        codeHash: values.codeHash,
        expiresAt: values.expiresAt,
        verifiedAt: values.verifiedAt,
        sendsThisHour: values.sendsThisHour,
        sendsToday: values.sendsToday,
        hourWindowStart: values.hourWindowStart,
        dayWindowStart: values.dayWindowStart,
        updatedAt: values.updatedAt,
      },
    })
    .returning();

  return rows[0] ?? null;
}

export async function confirmVerificationTransaction(db, input) {
  return db.transaction(async (tx) => {
    const verificationRows = await tx
      .select()
      .from(ucsdVerifications)
      .where(eq(ucsdVerifications.userId, input.userId))
      .limit(1);

    const verification = verificationRows[0] ?? null;
    if (!verification) {
      return { type: "not_found" };
    }

    await tx
      .update(ucsdVerifications)
      .set({
        codeHash: "",
        verifiedAt: input.now,
        updatedAt: input.now,
      })
      .where(eq(ucsdVerifications.userId, input.userId));

    await tx
      .update(users)
      .set({
        isUcsdVerified: true,
        ucsdEmail: input.email,
        updatedAt: input.now,
      })
      .where(eq(users.id, input.userId));

    await tx
      .update(listings)
      .set({
        sellerIsUcsdVerifiedSnapshot: true,
        updatedAt: input.now,
      })
      .where(eq(listings.sellerId, input.userId));

    await tx
      .update(conversations)
      .set({
        buyerIsUcsdVerifiedSnapshot: true,
      })
      .where(eq(conversations.buyerId, input.userId));

    await tx
      .update(conversations)
      .set({
        sellerIsUcsdVerifiedSnapshot: true,
      })
      .where(eq(conversations.sellerId, input.userId));

    return { type: "ok", verification };
  });
}
