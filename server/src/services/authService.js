import crypto from "node:crypto";
import {
  deleteSessionById,
  findSessionWithUserById,
  insertSession,
  touchSession,
} from "../repositories/sessionsRepository.js";
import {
  findUserByEmail,
  updateUserById,
  insertUser,
} from "../repositories/usersRepository.js";
import { serializeUser } from "../serializers/userSerializer.js";

const SESSION_COOKIE_NAME = "unitrade_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const GOOGLE_AUTH_SCOPE = "openid email profile";

function toTimestampValue(value) {
  if (value == null) {
    return value ?? null;
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp value: ${String(value)}`);
  }

  return parsed;
}

function nowTimestamp() {
  return toTimestampValue(new Date());
}

function sessionExpiryTimestamp() {
  return toTimestampValue(new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000));
}

function parseCookies(request) {
  const header = request.headers?.cookie ?? "";
  const cookies = new Map();
  for (const pair of header.split(";")) {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) {
      continue;
    }
    cookies.set(rawKey, decodeURIComponent(rawValue.join("=")));
  }
  return cookies;
}

function appendSetCookie(response, value) {
  const existing = response.getHeader?.("Set-Cookie");
  if (!existing) {
    response.setHeader?.("Set-Cookie", value);
    return;
  }

  if (Array.isArray(existing)) {
    response.setHeader?.("Set-Cookie", [...existing, value]);
    return;
  }

  response.setHeader?.("Set-Cookie", [existing, value]);
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getSessionCookieDomain() {
  const value = process.env.SESSION_COOKIE_DOMAIN?.trim();
  return value ? value : null;
}

function makeCookie(name, value, maxAge) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${isProduction() ? "None" : "Lax"}`,
    `Max-Age=${maxAge}`,
  ];

  if (isProduction()) {
    parts.push("Secure");
  }

  const domain = getSessionCookieDomain();
  if (domain) {
    parts.push(`Domain=${domain}`);
  }

  return parts.join("; ");
}

export function setSessionCookie(response, sessionId) {
  appendSetCookie(response, makeCookie(SESSION_COOKIE_NAME, sessionId, SESSION_MAX_AGE_SECONDS));
}

export function clearSessionCookie(response) {
  appendSetCookie(response, makeCookie(SESSION_COOKIE_NAME, "", 0));
}

function getDevAuthProfile() {
  const email = process.env.DEV_AUTH_EMAIL ?? "demo@ucsd.edu";
  const fullName = process.env.DEV_AUTH_NAME ?? "Demo User";
  const profilePhoto = process.env.DEV_AUTH_PHOTO ?? "";
  const bio = process.env.DEV_AUTH_BIO ?? "";
  const role = process.env.DEV_AUTH_ROLE ?? "user";
  const isUcsdVerified = (process.env.DEV_AUTH_UCSD_VERIFIED ?? "true") === "true";
  const ucsdEmail = process.env.DEV_AUTH_UCSD_EMAIL ?? (email.endsWith("@ucsd.edu") ? email : null);

  return {
    email,
    fullName,
    profilePhoto,
    bio,
    role,
    isUcsdVerified,
    ucsdEmail,
  };
}

export async function getSessionUser(request, database) {
  const cookies = parseCookies(request);
  const sessionId = cookies.get(SESSION_COOKIE_NAME);
  if (!sessionId) {
    return null;
  }

  const session = await findSessionWithUserById(database.db, sessionId);
  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await deleteSessionById(database.db, sessionId);
    return null;
  }

  await touchSession(database.db, sessionId, nowTimestamp());

  return {
    sessionId,
    user: serializeUser({
      id: session.userId,
      email: session.email,
      full_name: session.fullName,
      profile_photo_url: session.profilePhotoUrl,
      preferred_contacts_json: session.preferredContactsJson,
      bio: session.bio,
      is_ucsd_verified: session.isUcsdVerified,
      ucsd_email: session.ucsdEmail,
      role: session.role,
    }),
  };
}

function getGoogleClientId() {
  const value = process.env.GOOGLE_CLIENT_ID;
  if (!value) {
    throw new Error("GOOGLE_CLIENT_ID is required");
  }
  return value;
}

function getGoogleClientSecret() {
  const value = process.env.GOOGLE_CLIENT_SECRET;
  if (!value) {
    throw new Error("GOOGLE_CLIENT_SECRET is required");
  }
  return value;
}

function getGoogleOAuthStateSecret() {
  return process.env.GOOGLE_OAUTH_STATE_SECRET || getGoogleClientSecret();
}

function resolveRequestOrigin(request) {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const forwardedHost = request.headers["x-forwarded-host"];
  const host = forwardedHost || request.headers.host;
  const proto = forwardedProto || "http";

  if (!host) {
    throw new Error("Unable to determine request host");
  }

  return `${proto}://${host}`;
}

function getGoogleRedirectUri(request) {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }

  return new URL("/api/auth/google/callback", resolveRequestOrigin(request)).toString();
}

function encodeStatePayload(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signStatePayload(encodedPayload) {
  return crypto
    .createHmac("sha256", getGoogleOAuthStateSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function buildSignedState(returnTo) {
  const encodedPayload = encodeStatePayload({
    returnTo,
    nonce: crypto.randomUUID(),
    iat: Date.now(),
  });

  const signature = signStatePayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function buildGoogleAuthorizationUrl(request, returnTo) {
  const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  target.searchParams.set("client_id", getGoogleClientId());
  target.searchParams.set("redirect_uri", getGoogleRedirectUri(request));
  target.searchParams.set("response_type", "code");
  target.searchParams.set("scope", GOOGLE_AUTH_SCOPE);
  target.searchParams.set("state", buildSignedState(returnTo));
  target.searchParams.set("prompt", "select_account");
  return target.toString();
}

function decodeAndVerifyState(state) {
  if (!state || typeof state !== "string" || !state.includes(".")) {
    throw new Error("Invalid OAuth state");
  }

  const [encodedPayload, actualSignature] = state.split(".", 2);
  const expectedSignature = signStatePayload(encodedPayload);
  if (!crypto.timingSafeEqual(Buffer.from(actualSignature), Buffer.from(expectedSignature))) {
    throw new Error("Invalid OAuth state signature");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (!payload || typeof payload.returnTo !== "string") {
    throw new Error("Invalid OAuth state payload");
  }

  return payload;
}

async function exchangeGoogleCodeForTokens(request, code) {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: getGoogleRedirectUri(request),
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Google token exchange failed");
  }

  return payload;
}

async function fetchGoogleUserProfile(accessToken) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Google userinfo fetch failed");
  }

  if (!payload.email || !payload.email_verified) {
    throw new Error("Google account email is missing or unverified");
  }

  return payload;
}

async function completeLoginForProfile(response, database, profile) {
  let existing;

  try {
    existing = await findUserByEmail(database.db, profile.email);
  } catch (error) {
    throw new Error(`User lookup failed: ${error?.message ?? String(error)}`);
  }

  const userId = existing?.id ?? crypto.randomUUID();
  const timestamp = nowTimestamp();

  if (existing) {
    try {
      await updateUserById(database.db, userId, {
        fullName: profile.fullName || existing.fullName,
        profilePhotoUrl: existing.profilePhotoUrl || profile.profilePhoto || "",
        updatedAt: timestamp,
      });
    } catch (error) {
      throw new Error(`User update failed: ${error?.message ?? String(error)}`);
    }
  } else {
    try {
      await insertUser(database.db, {
        id: userId,
        email: profile.email,
        fullName: profile.fullName || profile.email,
        profilePhotoUrl: profile.profilePhoto || "",
        preferredContactsJson: {},
        bio: "",
        isUcsdVerified: false,
        ucsdEmail: null,
        role: "user",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    } catch (error) {
      throw new Error(`User creation failed: ${error?.message ?? String(error)}`);
    }
  }

  const sessionId = crypto.randomUUID();
  try {
    await insertSession(database.db, {
      id: sessionId,
      userId,
      expiresAt: sessionExpiryTimestamp(),
      createdAt: timestamp,
      lastSeenAt: timestamp,
    });
  } catch (error) {
    throw new Error(`Session creation failed: ${error?.message ?? String(error)}`);
  }

  try {
    setSessionCookie(response, sessionId);
  } catch (error) {
    throw new Error(`Set-Cookie generation failed: ${error?.message ?? String(error)}`);
  }
}

export async function completeDevLogin(response, database) {
  const profile = getDevAuthProfile();
  await completeLoginForProfile(response, database, profile);
}

export async function completeGoogleLogin(request, response, database, { code, state }) {
  const statePayload = decodeAndVerifyState(state);
  const tokens = await exchangeGoogleCodeForTokens(request, code);
  const googleUser = await fetchGoogleUserProfile(tokens.access_token);

  await completeLoginForProfile(response, database, {
    email: googleUser.email,
    fullName: googleUser.name || googleUser.email,
    profilePhoto: googleUser.picture || "",
  });

  return statePayload.returnTo;
}

export async function logoutSession(request, response, database) {
  const cookies = parseCookies(request);
  const sessionId = cookies.get(SESSION_COOKIE_NAME);
  if (sessionId) {
    await deleteSessionById(database.db, sessionId);
  }
  clearSessionCookie(response);
}
