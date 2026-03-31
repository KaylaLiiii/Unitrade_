import {
  deleteSavedListingByIdForUser,
  findSavedListingByIdForUser,
  findSavedListingByUserIdAndListingId,
  findUsersByIds,
  insertSavedListing,
  listSavedListingRows,
} from "../repositories/savedListingsRepository.js";
import { findListingRowById } from "../repositories/listingsRepository.js";
import { serializeSavedListing } from "../serializers/savedListingSerializer.js";
import { nowTimestamp } from "../utils/timestamps.js";

async function attachUserEmails(database, rows) {
  const missingUserIds = [...new Set(
    rows
      .filter((row) => row.userEmail == null && row.userId != null)
      .map((row) => row.userId)
  )];
  const usersById = await findUsersByIds(database.db, missingUserIds);

  return rows.map((row) => ({
    ...row,
    userEmail: row.userEmail ?? usersById.get(row.userId)?.email ?? "",
  }));
}

export async function listSavedListings(database, filter, sessionUser) {
  if (!filter?.listing_id && !Object.prototype.hasOwnProperty.call(filter ?? {}, "user_email")) {
    return [];
  }

  const normalizedFilter = {
    listingId: typeof filter.listing_id === "string" ? filter.listing_id : null,
    userId: null,
  };

  if (Object.prototype.hasOwnProperty.call(filter, "user_email")) {
    if (!sessionUser) {
      throw new Error("Authentication required");
    }
    normalizedFilter.userId = sessionUser.id;
  }

  const rows = await listSavedListingRows(database.db, normalizedFilter);
  const hydratedRows = await attachUserEmails(database, rows);
  return hydratedRows.map((row) => serializeSavedListing(row));
}

export async function createSavedListing(database, payload, sessionUser) {
  if (!sessionUser) {
    throw new Error("Authentication required");
  }

  const listingId = typeof payload?.listing_id === "string" ? payload.listing_id : null;
  if (!listingId) {
    throw new Error("listing_id is required");
  }

  const listing = await findListingRowById(database.db, listingId);
  if (!listing) {
    return { type: "not_found" };
  }

  const existing = await findSavedListingByUserIdAndListingId(database.db, sessionUser.id, listingId);
  if (existing) {
    return {
      type: "ok",
      item: serializeSavedListing({
        id: existing.id,
        userEmail: sessionUser.email,
        listingId: existing.listingId,
      }),
    };
  }

  const created = await insertSavedListing(database.db, sessionUser.id, listingId, nowTimestamp());
  if (!created) {
    const duplicate = await findSavedListingByUserIdAndListingId(database.db, sessionUser.id, listingId);
    return {
      type: "ok",
      item: serializeSavedListing({
        id: duplicate.id,
        userEmail: sessionUser.email,
        listingId: duplicate.listingId,
      }),
    };
  }

  return {
    type: "ok",
    item: serializeSavedListing({
      id: created.id,
      userEmail: sessionUser.email,
      listingId: created.listingId,
    }),
  };
}

export async function deleteSavedListing(database, savedListingId, sessionUser) {
  if (!sessionUser) {
    throw new Error("Authentication required");
  }

  const existing = await findSavedListingByIdForUser(database.db, savedListingId, sessionUser.id);
  if (!existing) {
    return { type: "not_found" };
  }

  await deleteSavedListingByIdForUser(database.db, savedListingId, sessionUser.id);
  return { type: "ok" };
}
