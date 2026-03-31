import { buildGoogleAuthorizationUrl, completeGoogleLogin, logoutSession } from "../auth/session.js";

function isLocalDev() {
  return process.env.NODE_ENV !== "production";
}

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function redirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

function safeReturnTo(value) {
  if (!value) {
    return "/";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return "/";
    }
  }

  if (!value.startsWith("/")) {
    return "/";
  }

  return value;
}

export async function authStartRoute(request, response, database) {
  const { searchParams } = new URL(request.url, "http://localhost");
  const incomingReturnTo = searchParams.get("returnTo");
  const returnTo = safeReturnTo(incomingReturnTo);

  try {
    const authorizationUrl = buildGoogleAuthorizationUrl(request, returnTo);
    redirect(response, authorizationUrl);
  } catch (error) {
    console.error("Failed to start login:", error);
    json(response, 500, {
      error: "Internal server error",
      ...(isLocalDev() ? { details: error?.message ?? String(error) } : {}),
    });
  }
}

export async function authCallbackRoute(request, response, database) {
  const { searchParams } = new URL(request.url, "http://localhost");
  const errorParam = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  try {
    if (errorParam) {
      json(response, 400, { error: `Google login failed: ${errorParam}` });
      return;
    }

    if (!code || !state) {
      json(response, 400, { error: "Missing Google OAuth code or state" });
      return;
    }

    const returnTo = await completeGoogleLogin(request, response, database, { code, state });
    redirect(response, returnTo);
  } catch (error) {
    console.error("Failed to complete login:", error);
    json(response, 500, {
      error: "Internal server error",
      ...(isLocalDev() ? { details: error?.message ?? String(error) } : {}),
    });
  }
}

export async function authLogoutRoute(request, response, database) {
  const { searchParams } = new URL(request.url, "http://localhost");
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  await logoutSession(request, response, database);
  json(response, 200, { ok: true, redirectTo: returnTo });
}
