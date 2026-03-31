import crypto from "node:crypto";
import { and, asc, count, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { conversations, messages } from "../db/schema.js";
import { nowTimestamp } from "../utils/timestamps.js";

const SORTS = {
  created_date: [asc(messages.createdAt), asc(messages.id)],
  "-created_date": [desc(messages.createdAt), desc(messages.id)],
};

function selectMessageFields() {
  return {
    id: messages.id,
    conversationId: messages.conversationId,
    senderId: messages.senderId,
    senderEmail: messages.senderEmailSnapshot,
    senderName: messages.senderNameSnapshot,
    text: messages.text,
    createdDate: messages.createdAt,
    isRead: messages.readAt,
    readAt: messages.readAt,
  };
}

export function getMessageSort(sort) {
  return SORTS[sort] ?? SORTS.created_date;
}

export async function listMessageRows(db, conversationId, sort, limit) {
  let query = db
    .select(selectMessageFields())
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(...sort);

  if (limit != null) {
    query = query.limit(limit);
  }

  return await query;
}

export async function findMessageById(db, messageId) {
  const rows = await db
    .select(selectMessageFields())
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertMessage(db, values) {
  const rows = await db
    .insert(messages)
    .values({
      id: values.id ?? crypto.randomUUID(),
      ...values,
    })
    .returning(selectMessageFields());

  return rows[0] ?? null;
}

export async function markMessageReadIfEligible(tx, messageId, actingUserId, readAt) {
  const rows = await tx
    .update(messages)
    .set({ readAt })
    .where(and(
      eq(messages.id, messageId),
      ne(messages.senderId, actingUserId),
      isNull(messages.readAt)
    ))
    .returning(selectMessageFields());

  return rows[0] ?? null;
}

export async function countUnreadIncomingMessages(tx, conversationId, actingUserId) {
  const rows = await tx
    .select({ value: count() })
    .from(messages)
    .where(and(
      eq(messages.conversationId, conversationId),
      ne(messages.senderId, actingUserId),
      isNull(messages.readAt)
    ));

  return Number(rows[0]?.value ?? 0);
}

export async function sendMessageTransaction(db, input) {
  return db.transaction(async (tx) => {
    const inserted = await insertMessage(tx, {
      conversationId: input.conversationId,
      senderId: input.senderId,
      senderEmailSnapshot: input.senderEmailSnapshot,
      senderNameSnapshot: input.senderNameSnapshot,
      text: input.text,
      createdAt: input.createdAt,
      readAt: null,
    });

    const unreadUpdate = input.senderRole === "buyer"
      ? {
          unreadForSeller: sql`${conversations.unreadForSeller} + 1`,
          hiddenByBuyer: false,
          hiddenBySeller: false,
        }
      : {
          unreadForBuyer: sql`${conversations.unreadForBuyer} + 1`,
          hiddenByBuyer: false,
          hiddenBySeller: false,
        };

    const updatedConversationRows = await tx
      .update(conversations)
      .set({
        lastMessage: input.text,
        lastMessageAt: input.createdAt,
        updatedAt: input.createdAt,
        ...unreadUpdate,
      })
      .where(eq(conversations.id, input.conversationId))
      .returning({
        unreadForBuyer: conversations.unreadForBuyer,
        unreadForSeller: conversations.unreadForSeller,
      });

    return {
      message: inserted,
      unreadForBuyer: updatedConversationRows[0]?.unreadForBuyer ?? input.previousUnreadForBuyer,
      unreadForSeller: updatedConversationRows[0]?.unreadForSeller ?? input.previousUnreadForSeller,
    };
  });
}

export async function markMessageReadTransaction(db, messageId, actingUserId) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        senderEmail: messages.senderEmailSnapshot,
        senderName: messages.senderNameSnapshot,
        text: messages.text,
        createdDate: messages.createdAt,
        isRead: messages.readAt,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    const current = existing[0] ?? null;
    if (!current) {
      return { type: "not_found" };
    }

    if (current.senderId === actingUserId) {
      return { type: "forbidden" };
    }

    const readAt = nowTimestamp();
    await tx
      .update(messages)
      .set({ readAt })
      .where(and(
        eq(messages.conversationId, current.conversationId),
        ne(messages.senderId, actingUserId),
        isNull(messages.readAt)
      ));

    const lockedConversationResult = await tx.execute(sql`
      select
        ${conversations.id} as "id",
        ${conversations.buyerId} as "buyerId",
        ${conversations.sellerId} as "sellerId"
      from ${conversations}
      where ${conversations.id} = ${current.conversationId}
      for update
    `);

    const conversation = lockedConversationResult.rows?.[0] ?? null;
    if (!conversation) {
      return { type: "not_found" };
    }

    const unreadCount = await countUnreadIncomingMessages(tx, current.conversationId, actingUserId);
    await tx
      .update(conversations)
      .set(
        conversation.buyerId === actingUserId
          ? { unreadForBuyer: unreadCount }
          : { unreadForSeller: unreadCount }
      )
      .where(eq(conversations.id, current.conversationId));

    const refreshedRows = await tx
      .select(selectMessageFields())
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    const messageRow = refreshedRows[0] ?? {
      ...current,
      isRead: readAt,
      readAt,
    };

    return {
      type: "ok",
      item: {
        id: messageRow.id,
        conversationId: messageRow.conversationId,
        senderEmail: messageRow.senderEmail,
        senderName: messageRow.senderName,
        text: messageRow.text,
        createdDate: messageRow.createdDate,
        isRead: messageRow.readAt ?? messageRow.isRead ?? readAt,
      },
    };
  });
}
