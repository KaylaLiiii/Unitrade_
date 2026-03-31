function parseJsonObject(value) {
  if (!value) {
    return {};
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function pick(row, snakeKey, camelKey) {
  if (row == null || typeof row !== "object") {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(row, snakeKey)) {
    return row[snakeKey];
  }

  if (Object.prototype.hasOwnProperty.call(row, camelKey)) {
    return row[camelKey];
  }

  return undefined;
}

export function serializeUser(row) {
  return {
    id: pick(row, "id", "id"),
    email: pick(row, "email", "email"),
    full_name: pick(row, "full_name", "fullName"),
    profile_photo: pick(row, "profile_photo_url", "profilePhotoUrl") ?? "",
    preferred_contacts: parseJsonObject(pick(row, "preferred_contacts_json", "preferredContactsJson")),
    bio: pick(row, "bio", "bio") ?? "",
    is_ucsd_verified: Boolean(pick(row, "is_ucsd_verified", "isUcsdVerified")),
    ucsd_email: pick(row, "ucsd_email", "ucsdEmail") ?? null,
    role: pick(row, "role", "role") ?? "user",
  };
}
