import crypto from "node:crypto";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { conversations, listings } from "../db/schema.js";

const SORTS = {
  updated_date: [asc(conversations.updatedAt), asc(conversations.id)],
  "-updated_date": [desc(conversations.updatedAt), desc(conversations.id)],
};

function selectConversationFields() {
  return {
    id: conversations.id,
    listingId: conversations.listingId,
    buyerId: conversations.buyerId,
    sellerId: conversations.sellerId,
    listingTitle: conversations.listingTitleSnapshot,
    buyerEmail: conversations.buyerEmailSnapshot,
    buyerName: conversations.buyerNameSnapshot,
    buyerPhoto: conversations.buyerPhotoSnapshot,
    buyerIsUcsdVerified: conversations.buyerIsUcsdVerifiedSnapshot,
    sellerEmail: conversations.sellerEmailSnapshot,
    sellerName: conversations.sellerNameSnapshot,
    sellerPhoto: conversations.sellerPhotoSnapshot,
    sellerIsUcsdVerified: conversations.sellerIsUcsdVerifiedSnapshot,
    lastMessage: conversations.lastMessage,
    lastMessageDate: conversations.lastMessageAt,
    updatedDate: conversations.updatedAt,
    hiddenByBuyer: conversations.hiddenByBuyer,
    hiddenBySeller: conversations.hiddenBySeller,
    unreadForBuyer: conversations.unreadForBuyer,
    unreadForSeller: conversations.unreadForSeller,
    createdAt: conversations.createdAt,
  };
}

export function getConversationSort(sort) {
  return SORTS[sort] ?? SORTS["-updated_date"];
}

export async function listConversationRows(db, filter, sort, limit) {
  const conditions = [];

  if (filter.buyerId) {
    conditions.push(eq(conversations.buyerId, filter.buyerId));
  }

  if (filter.sellerId) {
    conditions.push(eq(conversations.sellerId, filter.sellerId));
  }

  let query = db.select(selectConversationFields()).from(conversations);
  if (conditions.length) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(...sort);
  if (limit != null) {
    query = query.limit(limit);
  }

  return await query;
}

export async function findConversationById(db, conversationId) {
  const rows = await db
    .select(selectConversationFields())
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  return rows[0] ?? null;
}

export async function findConversationKey(db, listingId, buyerId, sellerId) {
  const rows = await db
    .select(selectConversationFields())
    .from(conversations)
    .where(and(
      eq(conversations.listingId, listingId),
      eq(conversations.buyerId, buyerId),
      eq(conversations.sellerId, sellerId)
    ))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertConversation(db, values) {
  const rows = await db
    .insert(conversations)
    .values({
      id: values.id ?? crypto.randomUUID(),
      ...values,
    })
    .onConflictDoNothing({
      target: [conversations.listingId, conversations.buyerId, conversations.sellerId],
    })
    .returning(selectConversationFields());

  return rows[0] ?? null;
}

export async function updateConversationById(db, conversationId, updates) {
  const rows = await db
    .update(conversations)
    .set(updates)
    .where(eq(conversations.id, conversationId))
    .returning(selectConversationFields());

  return rows[0] ?? null;
}

export async function findListingForConversationCreation(db, listingId) {
  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      status: listings.status,
      sellerId: listings.sellerId,
      sellerEmailSnapshot: listings.sellerEmailSnapshot,
      sellerNameSnapshot: listings.sellerNameSnapshot,
      sellerPhotoSnapshot: listings.sellerPhotoSnapshot,
      sellerIsUcsdVerifiedSnapshot: listings.sellerIsUcsdVerifiedSnapshot,
    })
    .from(listings)
    .where(and(eq(listings.id, listingId), isNull(listings.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}
