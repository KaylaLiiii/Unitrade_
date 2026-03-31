function pick(row, snakeKey, camelKey) {
  if (row == null || typeof row !== "object") {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(row, snakeKey)) {
    return row[snakeKey];
  }

  if (Object.prototype.hasOwnProperty.call(row, camelKey)) {
    return row[camelKey];
  }

  return undefined;
}

function serializeTimestamp(value) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

export function serializeConversation(row) {
  return {
    id: pick(row, "id", "id"),
    listing_id: pick(row, "listing_id", "listingId"),
    listing_title: pick(row, "listing_title", "listingTitle"),
    buyer_email: pick(row, "buyer_email", "buyerEmail"),
    buyer_name: pick(row, "buyer_name", "buyerName") ?? "",
    buyer_photo: pick(row, "buyer_photo", "buyerPhoto") ?? "",
    buyer_is_ucsd_verified: Boolean(pick(row, "buyer_is_ucsd_verified", "buyerIsUcsdVerified")),
    seller_email: pick(row, "seller_email", "sellerEmail"),
    seller_name: pick(row, "seller_name", "sellerName") ?? "",
    seller_photo: pick(row, "seller_photo", "sellerPhoto") ?? "",
    seller_is_ucsd_verified: Boolean(pick(row, "seller_is_ucsd_verified", "sellerIsUcsdVerified")),
    last_message: pick(row, "last_message", "lastMessage") ?? "",
    last_message_date: serializeTimestamp(pick(row, "last_message_date", "lastMessageDate")),
    updated_date: serializeTimestamp(pick(row, "updated_date", "updatedDate")),
    hidden_by_buyer: Boolean(pick(row, "hidden_by_buyer", "hiddenByBuyer")),
    hidden_by_seller: Boolean(pick(row, "hidden_by_seller", "hiddenBySeller")),
    unread_for_buyer: Number(pick(row, "unread_for_buyer", "unreadForBuyer") ?? 0),
    unread_for_seller: Number(pick(row, "unread_for_seller", "unreadForSeller") ?? 0),
  };
}
