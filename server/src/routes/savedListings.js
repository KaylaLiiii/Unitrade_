import { getSessionUser } from "../auth/session.js";
import {
  createSavedListing,
  deleteSavedListing,
  listSavedListings,
} from "../services/savedListingService.js";

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
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

function buildSavedListingsQuery(searchParams) {
  const query = {};
  const userEmail = searchParams.get("user_email");
  const listingId = searchParams.get("listing_id");

  if (userEmail != null) {
    query.user_email = userEmail;
  }

  if (listingId != null) {
    query.listing_id = listingId;
  }

  return query;
}

export async function getSavedListingsRoute(request, response, database) {
  try {
    const { searchParams } = new URL(request.url, "http://localhost");
    const session = await getSessionUser(request, database);
    const items = await listSavedListings(database, buildSavedListingsQuery(searchParams), session?.user ?? null);
    json(response, 200, { items });
  } catch (error) {
    if (error.message === "Authentication required") {
      json(response, 401, { error: error.message });
      return;
    }

    console.error("Failed to fetch saved listings:", error);
    json(response, 500, { error: "Internal server error" });
  }
}

export async function createSavedListingRoute(request, response, database) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const payload = await readJsonBody(request);
    const result = await createSavedListing(database, payload, session.user);

    if (result.type === "not_found") {
      json(response, 404, { error: "Listing not found" });
      return;
    }

    json(response, 200, { item: result.item });
  } catch (error) {
    if (error.message === "Invalid JSON" || error.message === "listing_id is required") {
      json(response, 400, { error: error.message });
      return;
    }

    if (error.message === "Authentication required") {
      json(response, 401, { error: error.message });
      return;
    }

    console.error("Failed to create saved listing:", error);
    json(response, 500, { error: "Internal server error" });
  }
}

export async function deleteSavedListingRoute(request, response, database, savedListingId) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const result = await deleteSavedListing(database, savedListingId, session.user);
    if (result.type === "not_found") {
      json(response, 404, { error: "Saved listing not found" });
      return;
    }

    json(response, 200, { ok: true });
  } catch (error) {
    if (error.message === "Authentication required") {
      json(response, 401, { error: error.message });
      return;
    }

    console.error("Failed to delete saved listing:", error);
    json(response, 500, { error: "Internal server error" });
  }
}
