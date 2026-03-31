import { getSessionUser } from "../auth/session.js";
import { createListing, deleteListing, listListings, updateListing } from "../services/listingService.js";

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function parseLimit(value) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid limit");
  }
  return parsed;
}

function parseIds(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Invalid JSON");
  }
}

function buildListingQuery(searchParams) {
  const sort = searchParams.get("sort");
  if (sort && !["created_date", "-created_date", "updated_date", "-updated_date"].includes(sort)) {
    throw new Error("Invalid sort");
  }

  return {
    id: searchParams.get("id"),
    ids: parseIds(searchParams.get("ids")),
    sellerEmail: searchParams.get("sellerEmail"),
    status: searchParams.get("status"),
    sort,
    limit: parseLimit(searchParams.get("limit")),
  };
}

export async function handleListingsRoute(request, response, database) {
  try {
    const { searchParams } = new URL(request.url, "http://localhost");
    const query = buildListingQuery(searchParams);
    const items = await listListings(database, query);
    json(response, 200, { items });
  } catch (error) {
    if (error.message === "Invalid sort" || error.message === "Invalid limit") {
      json(response, 400, { error: error.message });
      return;
    }

    console.error("Failed to fetch listings:", error);
    json(response, 500, { error: "Internal server error" });
  }
}

export async function createListingRoute(request, response, database) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const payload = await readJsonBody(request);
    const item = await createListing(database, payload, session.user);
    json(response, 201, { item });
  } catch (error) {
    if (error.message === "Invalid JSON") {
      json(response, 400, { error: error.message });
      return;
    }

    if (error.message === "Authentication required") {
      json(response, 401, { error: error.message });
      return;
    }

    console.error("Failed to create listing:", error);
    json(response, 500, { error: "Internal server error" });
  }
}

export async function updateListingRoute(request, response, database, listingId) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const payload = await readJsonBody(request);
    const result = await updateListing(database, listingId, payload, session.user);

    if (result.type === "not_found") {
      json(response, 404, { error: "Listing not found" });
      return;
    }
    if (result.type === "forbidden") {
      json(response, 403, { error: "Forbidden" });
      return;
    }
    json(response, 200, { item: result.item });
  } catch (error) {
    if (error.message === "Invalid JSON") {
      json(response, 400, { error: error.message });
      return;
    }

    console.error("Failed to update listing:", error);
    json(response, 500, { error: "Internal server error" });
  }
}

export async function deleteListingRoute(_request, response, database, listingId) {
  try {
    const session = await getSessionUser(_request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const result = await deleteListing(database, listingId, session.user);
    if (result.type === "not_found") {
      json(response, 404, { error: "Listing not found" });
      return;
    }
    if (result.type === "forbidden") {
      json(response, 403, { error: "Forbidden" });
      return;
    }

    json(response, 200, { ok: true });
  } catch (error) {
    console.error("Failed to delete listing:", error);
    json(response, 500, { error: "Internal server error" });
  }
}
