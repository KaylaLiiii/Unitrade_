import crypto from "node:crypto";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import {
  listingCategories,
  listingExchangeMethods,
  listingPhotos,
  listings,
} from "../db/schema.js";

const SORTS = {
  created_date: [asc(listings.createdAt), asc(listings.id)],
  "-created_date": [desc(listings.createdAt), desc(listings.id)],
  updated_date: [asc(listings.updatedAt), asc(listings.id)],
  "-updated_date": [desc(listings.updatedAt), desc(listings.id)],
};

export function getListingsSort(sort) {
  return SORTS[sort] ?? null;
}

export async function findListingRowById(db, listingId) {
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), isNull(listings.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export async function listListingRows(db, filter, sort, limit) {
  const conditions = [isNull(listings.deletedAt)];

  if (filter.id) {
    conditions.push(eq(listings.id, filter.id));
  }

  if (filter.ids?.length) {
    conditions.push(inArray(listings.id, filter.ids));
  }

  if (filter.sellerEmail) {
    conditions.push(eq(listings.sellerEmailSnapshot, filter.sellerEmail));
  }

  if (filter.status) {
    conditions.push(eq(listings.status, filter.status));
  }

  let query = db.select().from(listings).where(and(...conditions));

  if (sort) {
    query = query.orderBy(...sort);
  }

  if (limit != null && sort) {
    query = query.limit(limit);
  }

  return await query;
}

export async function getListingRelations(db, listingIds) {
  if (listingIds.length === 0) {
    return {
      categoriesByListingId: new Map(),
      photosByListingId: new Map(),
      exchangeMethodsByListingId: new Map(),
    };
  }

  const [categories, photos, exchangeMethods] = await Promise.all([
    db.select().from(listingCategories)
      .where(inArray(listingCategories.listingId, listingIds))
      .orderBy(asc(listingCategories.position), asc(listingCategories.category)),
    db.select().from(listingPhotos)
      .where(inArray(listingPhotos.listingId, listingIds))
      .orderBy(asc(listingPhotos.position), asc(listingPhotos.id)),
    db.select().from(listingExchangeMethods)
      .where(inArray(listingExchangeMethods.listingId, listingIds))
      .orderBy(asc(listingExchangeMethods.position), asc(listingExchangeMethods.id)),
  ]);

  const categoriesByListingId = new Map();
  for (const row of categories) {
    const values = categoriesByListingId.get(row.listingId) ?? [];
    values.push(row.category);
    categoriesByListingId.set(row.listingId, values);
  }

  const photosByListingId = new Map();
  for (const row of photos) {
    const values = photosByListingId.get(row.listingId) ?? [];
    values.push(row.fileUrl);
    photosByListingId.set(row.listingId, values);
  }

  const exchangeMethodsByListingId = new Map();
  for (const row of exchangeMethods) {
    const values = exchangeMethodsByListingId.get(row.listingId) ?? [];
    values.push({
      method: row.method,
      pickup_location: row.pickupLocation ?? "",
      meetup_zone: row.meetupZone ?? "",
      meetup_other: row.meetupOther ?? "",
      available_time: row.availableTime ?? "",
    });
    exchangeMethodsByListingId.set(row.listingId, values);
  }

  return {
    categoriesByListingId,
    photosByListingId,
    exchangeMethodsByListingId,
  };
}

export async function createListingGraph(db, listingRow, categories, photos, exchangeMethods) {
  return db.transaction(async (tx) => {
    const inserted = await tx.insert(listings).values(listingRow).returning();

    if (categories.length) {
      await tx.insert(listingCategories).values(
        categories.map((category, index) => ({
          listingId: listingRow.id,
          category,
          position: index,
        }))
      );
    }

    if (photos.length) {
      await tx.insert(listingPhotos).values(
        photos.map((fileUrl, index) => ({
          id: crypto.randomUUID(),
          listingId: listingRow.id,
          fileUrl,
          position: index,
        }))
      );
    }

    if (exchangeMethods.length) {
      await tx.insert(listingExchangeMethods).values(
        exchangeMethods.map((method, index) => ({
          id: crypto.randomUUID(),
          listingId: listingRow.id,
          position: index,
          method: method.method,
          pickupLocation: method.pickup_location,
          meetupZone: method.meetup_zone,
          meetupOther: method.meetup_other,
          availableTime: method.available_time,
        }))
      );
    }

    return inserted[0] ?? null;
  });
}
export async function updateListingGraph(db, listingId, listingUpdates, relationUpdates) {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(listings)
      .set(listingUpdates)
      .where(and(eq(listings.id, listingId), isNull(listings.deletedAt)))
      .returning();

    if (relationUpdates.categories) {
      await tx.delete(listingCategories).where(eq(listingCategories.listingId, listingId));
      if (relationUpdates.categories.length) {
        await tx.insert(listingCategories).values(
          relationUpdates.categories.map((category, index) => ({
            listingId,
            category,
            position: index,
          }))
        );
      }
    }

    if (relationUpdates.photos) {
      await tx.delete(listingPhotos).where(eq(listingPhotos.listingId, listingId));
      if (relationUpdates.photos.length) {
        await tx.insert(listingPhotos).values(
          relationUpdates.photos.map((fileUrl, index) => ({
            id: crypto.randomUUID(),
            listingId,
            fileUrl,
            position: index,
          }))
        );
      }
    }

    if (relationUpdates.exchangeMethods) {
      await tx.delete(listingExchangeMethods).where(eq(listingExchangeMethods.listingId, listingId));
      if (relationUpdates.exchangeMethods.length) {
        await tx.insert(listingExchangeMethods).values(
          relationUpdates.exchangeMethods.map((method, index) => ({
            id: crypto.randomUUID(),
            listingId,
            position: index,
            method: method.method,
            pickupLocation: method.pickup_location,
            meetupZone: method.meetup_zone,
            meetupOther: method.meetup_other,
            availableTime: method.available_time,
          }))
        );
      }
    }

    return updated[0] ?? null;
  });
}

export async function softDeleteListing(db, listingId, deletedAt, updatedAt) {
  const rows = await db
    .update(listings)
    .set({ deletedAt, updatedAt })
    .where(and(eq(listings.id, listingId), isNull(listings.deletedAt)))
    .returning();

  return rows[0] ?? null;
}

export async function backfillListingSellerIdIfMissing(db, listingId, sellerId) {
  const rows = await db
    .update(listings)
    .set({ sellerId })
    .where(and(eq(listings.id, listingId), isNull(listings.sellerId), isNull(listings.deletedAt)))
    .returning();

  return rows[0] ?? null;
}
