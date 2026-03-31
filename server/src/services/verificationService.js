import crypto from "node:crypto";
import {
  confirmVerificationTransaction,
  findVerificationByUserId,
  upsertVerificationByUserId,
} from "../repositories/verificationRepository.js";
import { nowTimestamp, toTimestampValue } from "../utils/timestamps.js";

const HOURLY_LIMIT = 3;
const DAILY_LIMIT = 10;
const EXPIRY_MINUTES = 10;

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isUcsdEmail(email) {
  return email.endsWith("@ucsd.edu");
}

function getCodeSecret() {
  const secret = process.env.VERIFICATION_CODE_SECRET;
  if (!secret) {
    throw new Error("Verification code secret is not configured");
  }
  return secret;
}

function hashCode(userId, email, code) {
  return crypto
    .createHmac("sha256", getCodeSecret())
    .update(`${userId}:${email}:${code}`)
    .digest("hex");
}

function generateCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function sendVerificationEmail(email, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.VERIFICATION_FROM_EMAIL;

  if (!apiKey || !from) {
    if (process.env.VERIFICATION_CONSOLE_FALLBACK === "true") {
      console.log(`UCSD verification code for ${email}: ${code}`);
      return;
    }
    throw new Error("Verification email is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Your UniTrade UCSD Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #FFF8EE; border-radius: 16px; border: 2px solid #F0DFC0;">
          <h2 style="color: #4A3B2A; margin-bottom: 8px;">UCSD Verification</h2>
          <p style="color: #7A5C3E; margin-bottom: 24px;">Your 6-digit code expires in ${EXPIRY_MINUTES} minutes.</p>
          <div style="background: #fff; border: 2px solid #F0DFC0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #4A3B2A;">${code}</span>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send verification email");
  }
}

function computeRateState(record, email, now) {
  const sameEmail = record && normalizeEmail(record.email) === email;
  if (!record || !sameEmail) {
    return {
      sendsThisHour: 0,
      sendsToday: 0,
      hourWindowStart: now,
      dayWindowStart: now,
    };
  }

  const hourWindowStart = record.hourWindowStart ? new Date(record.hourWindowStart) : null;
  const dayWindowStart = record.dayWindowStart ? new Date(record.dayWindowStart) : null;

  const withinHour = hourWindowStart && (now.getTime() - hourWindowStart.getTime()) < 60 * 60 * 1000;
  const withinDay = dayWindowStart && (now.getTime() - dayWindowStart.getTime()) < 24 * 60 * 60 * 1000;

  return {
    sendsThisHour: withinHour ? Number(record.sendsThisHour ?? 0) : 0,
    sendsToday: withinDay ? Number(record.sendsToday ?? 0) : 0,
    hourWindowStart: withinHour ? hourWindowStart : now,
    dayWindowStart: withinDay ? dayWindowStart : now,
  };
}

export async function sendUcsdVerification(database, payload, sessionUser) {
  if (!sessionUser) {
    throw new Error("Authentication required");
  }

  const email = normalizeEmail(payload?.email);
  if (!email || !isUcsdEmail(email)) {
    throw new Error("Use @ucsd.edu email.");
  }

  const now = nowTimestamp();
  const existing = await findVerificationByUserId(database.db, sessionUser.id);
  const rateState = computeRateState(existing, email, now);

  if (rateState.sendsThisHour >= HOURLY_LIMIT) {
    return { type: "rate_limited_hour" };
  }

  if (rateState.sendsToday >= DAILY_LIMIT) {
    return { type: "rate_limited_day" };
  }

  const code = generateCode();
  await sendVerificationEmail(email, code);

  await upsertVerificationByUserId(database.db, sessionUser.id, {
    id: existing?.id,
    email,
    codeHash: hashCode(sessionUser.id, email, code),
    expiresAt: new Date(now.getTime() + EXPIRY_MINUTES * 60 * 1000),
    verifiedAt: null,
    sendsThisHour: rateState.sendsThisHour + 1,
    sendsToday: rateState.sendsToday + 1,
    hourWindowStart: toTimestampValue(rateState.hourWindowStart),
    dayWindowStart: toTimestampValue(rateState.dayWindowStart),
    createdAt: toTimestampValue(existing?.createdAt ?? now),
    updatedAt: now,
  });

  return { type: "ok", payload: { message: "Code sent" } };
}

export async function confirmUcsdVerification(database, payload, sessionUser) {
  if (!sessionUser) {
    throw new Error("Authentication required");
  }

  const email = normalizeEmail(payload?.email);
  const code = String(payload?.code ?? "").trim();

  if (!email || !isUcsdEmail(email)) {
    throw new Error("Only @ucsd.edu emails can be verified.");
  }

  if (!/^\d{6}$/.test(code)) {
    throw new Error("Enter 6 digits.");
  }

  const record = await findVerificationByUserId(database.db, sessionUser.id);
  if (!record || normalizeEmail(record.email) !== email) {
    return { type: "invalid_code" };
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return { type: "expired" };
  }

  if (record.codeHash !== hashCode(sessionUser.id, email, code)) {
    return { type: "invalid_code" };
  }

  const result = await confirmVerificationTransaction(database.db, {
    userId: sessionUser.id,
    email,
    now: nowTimestamp(),
  });

  if (result.type !== "ok") {
    return { type: "invalid_code" };
  }

  return { type: "ok", payload: { message: "Verified" } };
}
