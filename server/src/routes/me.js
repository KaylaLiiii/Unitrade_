import { getSessionUser } from "../auth/session.js";
import { getCurrentUser, updateCurrentUser } from "../services/userService.js";

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

export async function getMeRoute(request, response, database) {
  const session = await getSessionUser(request, database);
  if (!session) {
    json(response, 401, { error: "Authentication required" });
    return;
  }

  const user = await getCurrentUser(database, session.user.id);
  json(response, 200, { user });
}

export async function patchMeRoute(request, response, database) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    const payload = await readJsonBody(request);
    const user = await updateCurrentUser(database, session.user.id, payload);
    json(response, 200, { user });
  } catch (error) {
    if (error.message === "Invalid JSON") {
      json(response, 400, { error: error.message });
      return;
    }

    console.error("Failed to update current user:", error);
    json(response, 500, { error: "Internal server error" });
  }
}
