import { getSessionUser } from "../auth/session.js";

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export async function getSessionRoute(request, response, database) {
  const session = await getSessionUser(request, database);
  if (!session) {
    json(response, 200, { isAuthenticated: false });
    return;
  }

  json(response, 200, {
    isAuthenticated: true,
    user: session.user,
  });
}
