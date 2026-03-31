import { getSessionUser } from "../auth/session.js";
import {
  confirmUcsdVerification,
  sendUcsdVerification,
} from "../services/verificationService.js";

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

export async function verifyUcsdSendRoute(request, response, database) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { message: "Not authenticated." });
      return;
    }

    const payload = await readJsonBody(request);
    const result = await sendUcsdVerification(database, payload, session.user);

    if (result.type === "rate_limited_hour") {
      json(response, 429, { message: "Too many codes sent. Please wait before requesting another." });
      return;
    }

    if (result.type === "rate_limited_day") {
      json(response, 429, { message: "Daily limit reached. Try again tomorrow." });
      return;
    }

    json(response, 200, result.payload);
  } catch (error) {
    if (error.message === "Invalid JSON" || error.message === "Use @ucsd.edu email.") {
      json(response, 400, { message: error.message });
      return;
    }

    if (error.message === "Authentication required") {
      json(response, 401, { message: "Not authenticated." });
      return;
    }

    console.error("Failed to send UCSD verification:", error);
    json(response, 500, { message: error.message || "Failed to generate code" });
  }
}

export async function verifyUcsdConfirmRoute(request, response, database) {
  try {
    const session = await getSessionUser(request, database);
    if (!session) {
      json(response, 401, { message: "Not authenticated." });
      return;
    }

    const payload = await readJsonBody(request);
    const result = await confirmUcsdVerification(database, payload, session.user);

    if (result.type === "invalid_code") {
      json(response, 400, { message: "Invalid code" });
      return;
    }

    if (result.type === "expired") {
      json(response, 400, { message: "This code has expired. Please request a new one." });
      return;
    }

    json(response, 200, result.payload);
  } catch (error) {
    if (
      error.message === "Invalid JSON" ||
      error.message === "Only @ucsd.edu emails can be verified." ||
      error.message === "Enter 6 digits."
    ) {
      json(response, 400, { message: error.message });
      return;
    }

    if (error.message === "Authentication required") {
      json(response, 401, { message: "Not authenticated." });
      return;
    }

    console.error("Failed to confirm UCSD verification:", error);
    json(response, 500, { message: error.message || "Failed to verify code" });
  }
}
