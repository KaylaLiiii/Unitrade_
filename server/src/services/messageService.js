import {
  getMessageSort,
  listMessageRows,
  findMessageById,
  markMessageReadTransaction,
  sendMessageTransaction,
} from "../repositories/messagesRepository.js";
import { findListingRowById } from "../repositories/listingsRepository.js";
import { serializeMessage } from "../serializers/messageSerializer.js";
import { nowTimestamp } from "../utils/timestamps.js";
import { getConversationForUser } from "./conversationService.js";

export async function listMessages(database, conversationId, sessionUser, sort, limit) {
  if (!sessionUser) {
    throw new Error("Authentication required");
  }

  const conversation = await getConversationForUser(database, conversationId, sessionUser);
  if (conversation.type !== "ok") {
    return conversation;
  }

  const rows = await listMessageRows(
    database.db,
    conversationId,
    getMessageSort(sort),
    limit ?? null
  );

  return { type: "ok", items: rows.map((row) => serializeMessage(row)) };
}

export async function createMessage(database, conversationId, payload, sessionUser) {
  if (!sessionUser) {
    throw new Error("Authentication required");
  }

  const text = typeof payload?.text === "string" ? payload.text.trim() : "";
  if (!text) {
    throw new Error("text is required");
  }

  const conversationResult = await getConversationForUser(database, conversationId, sessionUser);
  if (conversationResult.type !== "ok") {
    return conversationResult;
  }

  const conversation = conversationResult.item;
  const listing = await findListingRowById(database.db, conversation.listingId);
  if (!listing) {
    return { type: "not_found" };
  }

  if (listing.status === "sold") {
    return { type: "sold" };
  }

  const senderRole = conversation.buyerId === sessionUser.id ? "buyer" : "seller";
  const created = await sendMessageTransaction(database.db, {
    conversationId,
    senderId: sessionUser.id,
    senderEmailSnapshot: sessionUser.email,
    senderNameSnapshot: sessionUser.full_name,
    text,
    createdAt: nowTimestamp(),
    senderRole,
    previousUnreadForBuyer: conversation.unreadForBuyer,
    previousUnreadForSeller: conversation.unreadForSeller,
  });

  return { type: "ok", item: serializeMessage(created.message) };
}

export async function updateMessage(database, messageId, payload, sessionUser) {
  if (!sessionUser) {
    throw new Error("Authentication required");
  }

  if (payload?.is_read !== true) {
    throw new Error("Only is_read=true is supported");
  }

  const existing = await findMessageById(database.db, messageId);
  if (!existing) {
    return { type: "not_found" };
  }

  const conversationResult = await getConversationForUser(database, existing.conversationId, sessionUser);
  if (conversationResult.type !== "ok") {
    return conversationResult;
  }

  const result = await markMessageReadTransaction(database.db, messageId, sessionUser.id);
  if (result.type !== "ok") {
    return result;
  }

  return { type: "ok", item: serializeMessage(result.item) };
}
