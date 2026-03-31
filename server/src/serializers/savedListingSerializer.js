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

export function serializeSavedListing(row) {
  return {
    id: pick(row, "id", "id"),
    user_email: pick(row, "user_email", "userEmail"),
    listing_id: pick(row, "listing_id", "listingId"),
  };
}
