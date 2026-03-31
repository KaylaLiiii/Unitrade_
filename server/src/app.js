import http from "node:http";
import { getDb } from "./db/index.js";
import {
  createListingRoute,
  deleteListingRoute,
  handleListingsRoute,
  updateListingRoute,
} from "./routes/listings.js";
import { authCallbackRoute, authLogoutRoute, authStartRoute } from "./routes/auth.js";
import { patchMeRoute, getMeRoute } from "./routes/me.js";
import { getSessionRoute } from "./routes/session.js";
import {
  createSavedListingRoute,
  deleteSavedListingRoute,
  getSavedListingsRoute,
} from "./routes/savedListings.js";
import {
  createConversationMessageRoute,
  createConversationRoute,
  getConversationMessagesRoute,
  getConversationsRoute,
  patchConversationRoute,
} from "./routes/conversations.js";
import { patchMessageRoute } from "./routes/messages.js";
import { verifyUcsdConfirmRoute, verifyUcsdSendRoute } from "./routes/verifyUcsd.js";
import { createUploadRoute, getUploadedFileRoute } from "./routes/uploads.js";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const db = await getDb();

function notFound(response) {
  response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "Not found" }));
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    notFound(response);
    return;
  }

  if (request.method === "GET" && request.url.startsWith("/api/listings")) {
    await handleListingsRoute(request, response, db);
    return;
  }

  if (request.method === "GET" && request.url === "/api/session") {
    await getSessionRoute(request, response, db);
    return;
  }

  if (request.method === "GET" && request.url === "/api/me") {
    await getMeRoute(request, response, db);
    return;
  }

  if (request.method === "PATCH" && request.url === "/api/me") {
    await patchMeRoute(request, response, db);
    return;
  }

  if (request.method === "GET" && request.url.startsWith("/api/auth/google/start")) {
    await authStartRoute(request, response, db);
    return;
  }

  if (request.method === "GET" && request.url.startsWith("/api/auth/google/callback")) {
    await authCallbackRoute(request, response, db);
    return;
  }

  if (request.method === "POST" && request.url.startsWith("/api/auth/logout")) {
    await authLogoutRoute(request, response, db);
    return;
  }

  if (request.method === "POST" && request.url === "/api/listings") {
    await createListingRoute(request, response, db);
    return;
  }

  if (request.method === "POST" && request.url === "/api/uploads") {
    await createUploadRoute(request, response, db);
    return;
  }

  if (request.method === "GET" && request.url.startsWith("/api/saved-listings")) {
    await getSavedListingsRoute(request, response, db);
    return;
  }

  if (request.method === "POST" && request.url === "/api/saved-listings") {
    await createSavedListingRoute(request, response, db);
    return;
  }

  if (request.method === "GET" && request.url.startsWith("/api/conversations")) {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const conversationMessagesMatch = pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
    if (conversationMessagesMatch) {
      await getConversationMessagesRoute(request, response, db, decodeURIComponent(conversationMessagesMatch[1]));
      return;
    }

    await getConversationsRoute(request, response, db);
    return;
  }

  if (request.method === "POST" && request.url === "/api/conversations") {
    await createConversationRoute(request, response, db);
    return;
  }

  if (request.method === "POST" && request.url === "/api/verify-ucsd/send") {
    await verifyUcsdSendRoute(request, response, db);
    return;
  }

  if (request.method === "POST" && request.url === "/api/verify-ucsd/confirm") {
    await verifyUcsdConfirmRoute(request, response, db);
    return;
  }

  const pathname = new URL(request.url, "http://localhost").pathname;
  const listingIdMatch = pathname.match(/^\/api\/listings\/([^/]+)$/);
  if (listingIdMatch && request.method === "PATCH") {
    await updateListingRoute(request, response, db, decodeURIComponent(listingIdMatch[1]));
    return;
  }

  if (listingIdMatch && request.method === "DELETE") {
    await deleteListingRoute(request, response, db, decodeURIComponent(listingIdMatch[1]));
    return;
  }

  const savedListingIdMatch = pathname.match(/^\/api\/saved-listings\/([^/]+)$/);
  if (savedListingIdMatch && request.method === "DELETE") {
    await deleteSavedListingRoute(request, response, db, decodeURIComponent(savedListingIdMatch[1]));
    return;
  }

  const conversationIdMatch = pathname.match(/^\/api\/conversations\/([^/]+)$/);
  if (conversationIdMatch && request.method === "PATCH") {
    await patchConversationRoute(request, response, db, decodeURIComponent(conversationIdMatch[1]));
    return;
  }

  const conversationMessagesPostMatch = pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
  if (conversationMessagesPostMatch && request.method === "POST") {
    await createConversationMessageRoute(request, response, db, decodeURIComponent(conversationMessagesPostMatch[1]));
    return;
  }

  const messageIdMatch = pathname.match(/^\/api\/messages\/([^/]+)$/);
  if (messageIdMatch && request.method === "PATCH") {
    await patchMessageRoute(request, response, db, decodeURIComponent(messageIdMatch[1]));
    return;
  }

  const uploadedFileMatch = pathname.match(/^\/uploads\/(.+)$/);
  if (uploadedFileMatch && request.method === "GET") {
    await getUploadedFileRoute(request, response, decodeURIComponent(uploadedFileMatch[1]));
    return;
  }

  notFound(response);
});

server.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
