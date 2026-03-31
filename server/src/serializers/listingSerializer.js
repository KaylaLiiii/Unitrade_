function parseJsonObject(value) {
  if (!value) {
    return {};
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function coerceBoolean(value) {
  return Boolean(value);
}

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
  if (!value) {
    return value ?? null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

export function serializeListing(row, relations = {}) {
  const categories = relations.categories ?? [];
  const photos = relations.photos ?? [];
  const exchangeMethods = relations.exchangeMethods ?? [];
  const primaryMethod = exchangeMethods[0] ?? null;

  return {
    id: pick(row, "id", "id"),
    title: pick(row, "title", "title"),
    categories,
    category: categories[0] ?? null,
    price: Number(pick(row, "price", "price") ?? 0),
    sale_price: pick(row, "sale_price", "salePrice") == null ? null : Number(pick(row, "sale_price", "salePrice")),
    condition: pick(row, "condition", "condition"),
    description: pick(row, "description", "description") ?? "",
    photos,
    status: pick(row, "status", "status") ?? "available",
    created_date: serializeTimestamp(pick(row, "created_at", "createdAt")),
    updated_date: serializeTimestamp(pick(row, "updated_at", "updatedAt")),
    seller_email: pick(row, "seller_email_snapshot", "sellerEmailSnapshot"),
    seller_name: pick(row, "seller_name_snapshot", "sellerNameSnapshot") ?? "",
    seller_photo: pick(row, "seller_photo_snapshot", "sellerPhotoSnapshot") ?? "",
    seller_is_ucsd_verified: coerceBoolean(pick(row, "seller_is_ucsd_verified_snapshot", "sellerIsUcsdVerifiedSnapshot")),
    seller_bio: pick(row, "seller_bio_snapshot", "sellerBioSnapshot") ?? "",
    seller_preferred_contacts: parseJsonObject(pick(row, "seller_contacts_snapshot", "sellerContactsSnapshot")),
    exchange_methods: exchangeMethods,
    delivery_method: primaryMethod?.method ?? "",
    pickup_location: primaryMethod?.pickup_location ?? "",
    meetup_zone: primaryMethod?.meetup_zone ?? "",
    meetup_other: primaryMethod?.meetup_other ?? "",
    available_time: primaryMethod?.available_time ?? "",
  };
}
