import { getSessionUser } from "../auth/session.js";
import {
  createConversation,
  listConversations,
  updateConversation,
} from "../services/conversationService.js";
import {
  createMessage,
  listMessages,
} from "../services/messageService.js";

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

function buildConversationQuery(searchParams) {
  const sort = searchParams.get("sort");
  if (sort && !["updated_date", "-updated_date"].includes(sort)) {
    throw new Error("Invalid sort");
  }

  const query = {};
  const buyerEmail = searchParams.get("buyer_email");
  const sellerEmail = searchParams.get("seller_email");

  if (buyerEmail != null) {
    query.buyer_email = buyerEmail;
  }

  if (sellerEmail != null) {
    query.seller_email = sellerEmail;
  }

  return {
    filter: query,
    sort,
    limit: parseLimit(searchParams.get("limit")),
  };
}

function buildMessageQuery(searchParams) {
  const sort = searchParams.get("sort");
  if (sort && !["created_date", "-created_date"].includes(sort)) {
    throw new Error("Invalid sort");
  }

  return {
    sort,
    limit: parseLimit(searchParams.get("limit")),
  };
}

export async function getConversationsRoute(request, response, database) {
  try {
    const { searchParams } = new URL(request.url, "http://localhost");
    const session = await getSessionUser(request, database);
    const query = buildConversationQuery(searchParams);
    const items = await listConversations(database, query.filter, session?.user ?? null, query.sort, query.limit);
    json(response, 200, { items });
  } catch (error) {
    if (error.message === "Authentication required") {
      json(response, 401, { error: error.message });
      return;
    }

    if (error.message === "Invalid sort" || error.message === "Invalid limit") {
      json(response, 400, { error: error.message });
      return;
    }

    console.error("Failed to fetch conversations:", error);
    json(response, 500, { error: "Internal server error" });
  }
}

export async function createConversationRoute(request, response, database) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const payload = await readJsonBody(request);
    const result = await createConversation(database, payload, session.user);

    if (result.type === "not_found") {
      json(response, 404, { error: "Listing not found" });
      return;
    }

    if (result.type === "seller_unavailable") {
      json(response, 422, { error: "Listing seller is not available" });
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

    console.error("Failed to create conversation:", error);
    json(response, 500, { error: "Internal server error" });
  }
}

export async function patchConversationRoute(request, response, database, conversationId) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const payload = await readJsonBody(request);
    const result = await updateConversation(database, conversationId, payload, session.user);

    if (result.type === "not_found") {
      json(response, 404, { error: "Conversation not found" });
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

    if (error.message === "Authentication required") {
      json(response, 401, { error: error.message });
      return;
    }

    console.error("Failed to update conversation:", error);
    json(response, 500, { error: "Internal server error" });
  }
}

export async function getConversationMessagesRoute(request, response, database, conversationId) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const { searchParams } = new URL(request.url, "http://localhost");
    const query = buildMessageQuery(searchParams);
    const result = await listMessages(database, conversationId, session.user, query.sort, query.limit);

    if (result.type === "not_found") {
      json(response, 404, { error: "Conversation not found" });
      return;
    }

    if (result.type === "forbidden") {
      json(response, 403, { error: "Forbidden" });
      return;
    }

    json(response, 200, { items: result.items });
  } catch (error) {
    if (error.message === "Invalid sort" || error.message === "Invalid limit") {
      json(response, 400, { error: error.message });
      return;
    }

    if (error.message === "Authentication required") {
      json(response, 401, { error: error.message });
      return;
    }

    console.error("Failed to fetch messages:", error);
    json(response, 500, { error: "Internal server error" });
  }
}

export async function createConversationMessageRoute(request, response, database, conversationId) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const payload = await readJsonBody(request);
    const result = await createMessage(database, conversationId, payload, session.user);

    if (result.type === "not_found") {
      json(response, 404, { error: "Conversation or listing not found" });
      return;
    }

    if (result.type === "forbidden") {
      json(response, 403, { error: "Forbidden" });
      return;
    }

    if (result.type === "sold") {
      json(response, 422, { error: "Listing is sold" });
      return;
    }

    json(response, 200, { item: result.item });
  } catch (error) {
    if (error.message === "Invalid JSON" || error.message === "text is required") {
      json(response, 400, { error: error.message });
      return;
    }

    if (error.message === "Authentication required") {
      json(response, 401, { error: error.message });
      return;
    }

    console.error("Failed to create message:", error);
    json(response, 500, { error: "Internal server error" });
  }
}
