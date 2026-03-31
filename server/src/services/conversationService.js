import {
  findConversationById,
  findConversationKey,
  findListingForConversationCreation,
  getConversationSort,
  insertConversation,
  listConversationRows,
  updateConversationById,
} from "../repositories/conversationsRepository.js";
import { backfillListingSellerIdIfMissing } from "../repositories/listingsRepository.js";
import { findUserByEmail } from "../repositories/usersRepository.js";
import { serializeConversation } from "../serializers/conversationSerializer.js";
import { nowTimestamp } from "../utils/timestamps.js";

function normalizeUserIdentity(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name ?? user.fullName ?? "",
    profile_photo: user.profile_photo ?? user.profilePhoto ?? user.profilePhotoUrl ?? "",
    is_ucsd_verified: Boolean(user.is_ucsd_verified ?? user.isUcsdVerified),
  };
}

export async function listConversations(database, filter, sessionUser, sort, limit) {
  if (!sessionUser) {
    throw new Error("Authentication required");
  }

  const normalizedFilter = {};
  if (Object.prototype.hasOwnProperty.call(filter ?? {}, "buyer_email")) {
    normalizedFilter.buyerId = sessionUser.id;
  }

  if (Object.prototype.hasOwnProperty.call(filter ?? {}, "seller_email")) {
    normalizedFilter.sellerId = sessionUser.id;
  }

  if (!normalizedFilter.buyerId && !normalizedFilter.sellerId) {
    return [];
  }

  const rows = await listConversationRows(
    database.db,
    normalizedFilter,
    getConversationSort(sort),
    limit ?? null
  );

  return rows.map((row) => serializeConversation(row));
}

export async function createConversation(database, payload, sessionUser) {
  if (!sessionUser) {
    throw new Error("Authentication required");
  }

  const listingId = typeof payload?.listing_id === "string" ? payload.listing_id : null;
  if (!listingId) {
    throw new Error("listing_id is required");
  }

  const listing = await findListingForConversationCreation(database.db, listingId);
  if (!listing) {
    return { type: "not_found" };
  }

  const sellerUser = normalizeUserIdentity(listing.sellerId
    ? {
        id: listing.sellerId,
        email: listing.sellerEmailSnapshot,
        full_name: listing.sellerNameSnapshot,
        profile_photo: listing.sellerPhotoSnapshot ?? "",
        is_ucsd_verified: Boolean(listing.sellerIsUcsdVerifiedSnapshot),
      }
    : await findUserByEmail(database.db, listing.sellerEmailSnapshot));

  if (!sellerUser?.id) {
    return { type: "seller_unavailable" };
  }

  if (!listing.sellerId) {
    await backfillListingSellerIdIfMissing(database.db, listing.id, sellerUser.id);
  }

  const existing = await findConversationKey(database.db, listing.id, sessionUser.id, sellerUser.id);
  if (existing) {
    return { type: "ok", item: serializeConversation(existing) };
  }

  const timestamp = nowTimestamp();
  const inserted = await insertConversation(database.db, {
    listingId: listing.id,
    buyerId: sessionUser.id,
    sellerId: sellerUser.id,
    listingTitleSnapshot: listing.title,
    buyerEmailSnapshot: sessionUser.email,
    buyerNameSnapshot: sessionUser.full_name,
    buyerPhotoSnapshot: sessionUser.profile_photo ?? "",
    buyerIsUcsdVerifiedSnapshot: Boolean(sessionUser.is_ucsd_verified),
    sellerEmailSnapshot: sellerUser.email,
    sellerNameSnapshot: sellerUser.full_name ?? listing.sellerNameSnapshot,
    sellerPhotoSnapshot: sellerUser.profile_photo ?? listing.sellerPhotoSnapshot ?? "",
    sellerIsUcsdVerifiedSnapshot: Boolean(
      sellerUser.is_ucsd_verified ?? listing.sellerIsUcsdVerifiedSnapshot
    ),
    lastMessage: "",
    lastMessageAt: null,
    hiddenByBuyer: false,
    hiddenBySeller: false,
    unreadForBuyer: 0,
    unreadForSeller: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  if (!inserted) {
    const duplicate = await findConversationKey(database.db, listing.id, sessionUser.id, sellerUser.id);
    return { type: "ok", item: serializeConversation(duplicate) };
  }

  return { type: "ok", item: serializeConversation(inserted) };
}

export async function updateConversation(database, conversationId, payload, sessionUser) {
  if (!sessionUser) {
    throw new Error("Authentication required");
  }

  const existing = await findConversationById(database.db, conversationId);
  if (!existing) {
    return { type: "not_found" };
  }

  const isBuyer = existing.buyerId === sessionUser.id;
  const isSeller = existing.sellerId === sessionUser.id;

  if (!isBuyer && !isSeller) {
    return { type: "forbidden" };
  }

  const updates = {};
  if (isBuyer && Object.prototype.hasOwnProperty.call(payload, "hidden_by_buyer")) {
    updates.hiddenByBuyer = Boolean(payload.hidden_by_buyer);
  }

  if (isSeller && Object.prototype.hasOwnProperty.call(payload, "hidden_by_seller")) {
    updates.hiddenBySeller = Boolean(payload.hidden_by_seller);
  }

  if (Object.keys(updates).length === 0) {
    return { type: "ok", item: serializeConversation(existing) };
  }

  const updated = await updateConversationById(database.db, conversationId, updates);
  return { type: "ok", item: serializeConversation(updated) };
}

export async function getConversationForUser(database, conversationId, sessionUser) {
  const conversation = await findConversationById(database.db, conversationId);
  if (!conversation) {
    return { type: "not_found" };
  }

  if (conversation.buyerId !== sessionUser.id && conversation.sellerId !== sessionUser.id) {
    return { type: "forbidden" };
  }

  return { type: "ok", item: conversation };
}
