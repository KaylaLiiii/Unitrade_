import { getSessionUser } from "../auth/session.js";
import { updateMessage } from "../services/messageService.js";

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

export async function patchMessageRoute(request, response, database, messageId) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const payload = await readJsonBody(request);
    const result = await updateMessage(database, messageId, payload, session.user);

    if (result.type === "not_found") {
      json(response, 404, { error: "Message not found" });
      return;
    }

    if (result.type === "forbidden") {
      json(response, 403, { error: "Forbidden" });
      return;
    }

    json(response, 200, { item: result.item });
  } catch (error) {
    if (error.message === "Invalid JSON" || error.message === "Only is_read=true is supported") {
      json(response, 400, { error: error.message });
      return;
    }

    if (error.message === "Authentication required") {
      json(response, 401, { error: error.message });
      return;
    }

    console.error("Failed to update message:", error);
    json(response, 500, { error: "Internal server error" });
  }
}
