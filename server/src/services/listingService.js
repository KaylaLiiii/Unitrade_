import crypto from "node:crypto";
import {
  createListingGraph,
  findListingRowById,
  getListingRelations,
  getListingsSort,
  listListingRows,
  softDeleteListing,
  updateListingGraph,
} from "../repositories/listingsRepository.js";
import { serializeListing } from "../serializers/listingSerializer.js";

function toTimestampValue(value) {
  if (value == null) {
    return value ?? null;
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp value: ${String(value)}`);
  }

  return parsed;
}

function nowTimestamp() {
  return toTimestampValue(new Date());
}

function normalizeNullableString(value, fallback = "") {
  if (value == null) {
    return fallback;
  }
  return String(value);
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => normalizeNullableString(item, "").trim()).filter(Boolean);
}

function normalizeExchangeMethods(payload) {
  if (Array.isArray(payload.exchange_methods)) {
    return payload.exchange_methods.map((method) => ({
      method: normalizeNullableString(method?.method, ""),
      pickup_location: normalizeNullableString(method?.pickup_location, ""),
      meetup_zone: normalizeNullableString(method?.meetup_zone, ""),
      meetup_other: normalizeNullableString(method?.meetup_other, ""),
      available_time: normalizeNullableString(method?.available_time, ""),
    })).filter((method) => method.method);
  }

  if (payload.delivery_method) {
    return [{
      method: normalizeNullableString(payload.delivery_method, ""),
      pickup_location: normalizeNullableString(payload.pickup_location, ""),
      meetup_zone: normalizeNullableString(payload.meetup_zone, ""),
      meetup_other: normalizeNullableString(payload.meetup_other, ""),
      available_time: normalizeNullableString(payload.available_time, ""),
    }].filter((method) => method.method);
  }

  return [];
}

function normalizeListFilter(input) {
  return {
    id: typeof input.id === "string" ? input.id : null,
    ids: Array.isArray(input.ids) ? input.ids : [],
    sellerEmail: typeof input.sellerEmail === "string" ? input.sellerEmail : null,
    status: typeof input.status === "string" ? input.status : null,
  };
}

function applyIdsOrdering(rows, ids, limit) {
  if (ids.length === 0) {
    return limit == null ? rows : rows.slice(0, limit);
  }

  const rank = new Map(ids.map((value, index) => [value, index]));
  const sortedRows = [...rows].sort((a, b) => {
    const rankA = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.id.localeCompare(b.id);
  });

  return limit == null ? sortedRows : sortedRows.slice(0, limit);
}

async function serializeListingRows(database, rows) {
  const listingIds = rows.map((row) => row.id);
  const relations = await getListingRelations(database.db, listingIds);
  return rows.map((row) => serializeListing(row, {
    categories: relations.categoriesByListingId.get(row.id) ?? [],
    photos: relations.photosByListingId.get(row.id) ?? [],
    exchangeMethods: relations.exchangeMethodsByListingId.get(row.id) ?? [],
  }));
}

export async function listListings(database, options) {
  const sort = options.sort ? getListingsSort(options.sort) : null;
  const rows = await listListingRows(
    database.db,
    normalizeListFilter(options),
    sort,
    options.limit ?? null
  );

  const orderedRows = !options.sort && options.ids?.length
    ? applyIdsOrdering(rows, options.ids, options.limit ?? null)
    : (options.limit != null && !options.sort ? rows.slice(0, options.limit) : rows);

  return serializeListingRows(database, orderedRows);
}

export async function getListingById(database, listingId) {
  const row = await findListingRowById(database.db, listingId);
  if (!row) {
    return null;
  }
  const items = await serializeListingRows(database, [row]);
  return items[0] ?? null;
}

export async function createListing(database, payload, sessionUser) {
  const timestamp = nowTimestamp();
  const listingRow = {
    id: crypto.randomUUID(),
    title: normalizeNullableString(payload.title, ""),
    price: String(Number(payload.price ?? 0)),
    salePrice: payload.sale_price == null ? null : String(Number(payload.sale_price)),
    condition: normalizeNullableString(payload.condition, ""),
    description: normalizeNullableString(payload.description, ""),
    status: normalizeNullableString(payload.status, "available"),
    sellerId: sessionUser.id,
    sellerEmailSnapshot: sessionUser.email,
    sellerNameSnapshot: sessionUser.full_name,
    sellerPhotoSnapshot: sessionUser.profile_photo ?? "",
    sellerIsUcsdVerifiedSnapshot: Boolean(sessionUser.is_ucsd_verified),
    sellerBioSnapshot: sessionUser.bio ?? "",
    sellerContactsSnapshot: sessionUser.preferred_contacts ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };

  await createListingGraph(
    database.db,
    listingRow,
    normalizeStringArray(payload.categories),
    normalizeStringArray(payload.photos),
    normalizeExchangeMethods(payload)
  );

  return getListingById(database, listingRow.id);
}

export async function updateListing(database, listingId, payload, sessionUser) {
  const existing = await findListingRowById(database.db, listingId);
  if (!existing) {
    return { type: "not_found" };
  }

  const ownsListing =
    existing.sellerId === sessionUser.id ||
    (!existing.sellerId && existing.sellerEmailSnapshot === sessionUser.email);

  if (!ownsListing) {
    return { type: "forbidden" };
  }

  const updates = {
    title: Object.prototype.hasOwnProperty.call(payload, "title")
      ? normalizeNullableString(payload.title, "")
      : existing.title,
    price: Object.prototype.hasOwnProperty.call(payload, "price")
      ? String(Number(payload.price ?? 0))
      : existing.price,
    salePrice: Object.prototype.hasOwnProperty.call(payload, "sale_price")
      ? (payload.sale_price == null ? null : String(Number(payload.sale_price)))
      : existing.salePrice,
    condition: Object.prototype.hasOwnProperty.call(payload, "condition")
      ? normalizeNullableString(payload.condition, "")
      : existing.condition,
    description: Object.prototype.hasOwnProperty.call(payload, "description")
      ? normalizeNullableString(payload.description, "")
      : (existing.description ?? ""),
    status: Object.prototype.hasOwnProperty.call(payload, "status")
      ? normalizeNullableString(payload.status, "available")
      : (existing.status ?? "available"),
    sellerId: sessionUser.id,
    sellerEmailSnapshot: sessionUser.email,
    sellerNameSnapshot: sessionUser.full_name,
    sellerPhotoSnapshot: sessionUser.profile_photo ?? "",
    sellerIsUcsdVerifiedSnapshot: Boolean(sessionUser.is_ucsd_verified),
    sellerBioSnapshot: sessionUser.bio ?? "",
    sellerContactsSnapshot: sessionUser.preferred_contacts ?? {},
    updatedAt: nowTimestamp(),
  };

  const relationUpdates = {
    categories: Object.prototype.hasOwnProperty.call(payload, "categories")
      ? normalizeStringArray(payload.categories)
      : null,
    photos: Object.prototype.hasOwnProperty.call(payload, "photos")
      ? normalizeStringArray(payload.photos)
      : null,
    exchangeMethods:
      Object.prototype.hasOwnProperty.call(payload, "exchange_methods") ||
      Object.prototype.hasOwnProperty.call(payload, "delivery_method") ||
      Object.prototype.hasOwnProperty.call(payload, "pickup_location") ||
      Object.prototype.hasOwnProperty.call(payload, "meetup_zone") ||
      Object.prototype.hasOwnProperty.call(payload, "meetup_other") ||
      Object.prototype.hasOwnProperty.call(payload, "available_time")
        ? normalizeExchangeMethods(payload)
        : null,
  };

  await updateListingGraph(database.db, listingId, updates, relationUpdates);
  return { type: "ok", item: await getListingById(database, listingId) };
}

export async function deleteListing(database, listingId, sessionUser) {
  const existing = await findListingRowById(database.db, listingId);
  if (!existing) {
    return { type: "not_found" };
  }

  const ownsListing =
    existing.sellerId === sessionUser.id ||
    (!existing.sellerId && existing.sellerEmailSnapshot === sessionUser.email);

  if (!ownsListing) {
    return { type: "forbidden" };
  }

  const timestamp = nowTimestamp();
  await softDeleteListing(database.db, listingId, timestamp, timestamp);
  return { type: "ok" };
}
