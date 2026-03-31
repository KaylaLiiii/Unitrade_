import { findUserById, updateUserById } from "../repositories/usersRepository.js";
import { serializeUser } from "../serializers/userSerializer.js";
import { nowTimestamp } from "../utils/timestamps.js";

export async function getCurrentUser(database, userId) {
  const row = await findUserById(database.db, userId);
  return row ? serializeUser({
    id: row.id,
    email: row.email,
    full_name: row.fullName,
    profile_photo_url: row.profilePhotoUrl,
    preferred_contacts_json: row.preferredContactsJson,
    bio: row.bio,
    is_ucsd_verified: row.isUcsdVerified,
    ucsd_email: row.ucsdEmail,
    role: row.role,
  }) : null;
}

export async function updateCurrentUser(database, userId, payload) {
  const current = await findUserById(database.db, userId);
  if (!current) {
    return null;
  }

  const updated = await updateUserById(database.db, userId, {
    profilePhotoUrl: Object.prototype.hasOwnProperty.call(payload, "profile_photo")
      ? (payload.profile_photo ?? "")
      : (current.profilePhotoUrl ?? ""),
    preferredContactsJson: Object.prototype.hasOwnProperty.call(payload, "preferred_contacts")
      ? (payload.preferred_contacts && typeof payload.preferred_contacts === "object" ? payload.preferred_contacts : {})
      : (current.preferredContactsJson ?? {}),
    bio: Object.prototype.hasOwnProperty.call(payload, "bio")
      ? (payload.bio ?? "")
      : (current.bio ?? ""),
    updatedAt: nowTimestamp(),
  });

  return serializeUser({
    id: updated.id,
    email: updated.email,
    full_name: updated.fullName,
    profile_photo_url: updated.profilePhotoUrl,
    preferred_contacts_json: updated.preferredContactsJson,
    bio: updated.bio,
    is_ucsd_verified: updated.isUcsdVerified,
    ucsd_email: updated.ucsdEmail,
    role: updated.role,
  });
}
