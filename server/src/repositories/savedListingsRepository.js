import crypto from "node:crypto";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { listings, savedListings, users } from "../db/schema.js";

export async function listSavedListingRows(db, filter) {
  const conditions = [isNull(listings.deletedAt)];

  if (filter.listingId) {
    conditions.push(eq(savedListings.listingId, filter.listingId));
  }

  if (filter.userId) {
    conditions.push(eq(savedListings.userId, filter.userId));
  }

  const rows = await db
    .select({
      id: savedListings.id,
      userId: savedListings.userId,
      userEmail: users.email,
      listingId: savedListings.listingId,
      createdAt: savedListings.createdAt,
    })
    .from(savedListings)
    .innerJoin(users, eq(users.id, savedListings.userId))
    .innerJoin(listings, eq(listings.id, savedListings.listingId))
    .where(and(...conditions))
    .orderBy(asc(savedListings.createdAt), asc(savedListings.id));

  return rows;
}

export async function findSavedListingByUserIdAndListingId(db, userId, listingId) {
  const rows = await db
    .select({
      id: savedListings.id,
      userId: savedListings.userId,
      listingId: savedListings.listingId,
      createdAt: savedListings.createdAt,
    })
    .from(savedListings)
    .where(and(eq(savedListings.userId, userId), eq(savedListings.listingId, listingId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertSavedListing(db, userId, listingId, createdAt) {
  const rows = await db
    .insert(savedListings)
    .values({
      id: crypto.randomUUID(),
      userId,
      listingId,
      createdAt,
    })
    .onConflictDoNothing({
      target: [savedListings.userId, savedListings.listingId],
    })
    .returning();

  return rows[0] ?? null;
}

export async function findSavedListingByIdForUser(db, savedListingId, userId) {
  const rows = await db
    .select({
      id: savedListings.id,
      userId: savedListings.userId,
      listingId: savedListings.listingId,
      createdAt: savedListings.createdAt,
    })
    .from(savedListings)
    .where(and(eq(savedListings.id, savedListingId), eq(savedListings.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function deleteSavedListingByIdForUser(db, savedListingId, userId) {
  const rows = await db
    .delete(savedListings)
    .where(and(eq(savedListings.id, savedListingId), eq(savedListings.userId, userId)))
    .returning();

  return rows[0] ?? null;
}

export async function findUsersByIds(db, userIds) {
  if (!userIds.length) {
    return new Map();
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  return new Map(rows.map((row) => [row.id, row]));
}
