import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

function resolveUploadsRoot() {
  return path.resolve(process.env.UPLOADS_DIR ?? path.join(process.cwd(), "storage", "uploads"));
}

function resolvePublicBaseUrl(request) {
  if (process.env.UPLOADS_PUBLIC_BASE_URL) {
    return process.env.UPLOADS_PUBLIC_BASE_URL.replace(/\/+$/, "");
  }

  const host = request.headers.host ?? `localhost:${process.env.PORT ?? "3001"}`;
  const protocol = process.env.UPLOADS_PUBLIC_PROTOCOL ?? "http";
  return `${protocol}://${host}`;
}

function getExtension(contentType, filename = "") {
  const normalizedType = String(contentType ?? "").toLowerCase();
  if (IMAGE_EXTENSIONS[normalizedType]) {
    return IMAGE_EXTENSIONS[normalizedType];
  }

  const ext = path.extname(filename).replace(/^\./, "").toLowerCase();
  if (Object.values(IMAGE_EXTENSIONS).includes(ext)) {
    return ext;
  }

  return "bin";
}

function buildPathParts({ userId, kind, timestamp, extension }) {
  const date = new Date(timestamp);
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const safeKind = kind === "profile" ? "profile-photos" : "listing-photos";
  const filename = `${crypto.randomUUID()}.${extension}`;

  return {
    storageKey: `${safeKind}/${userId}/${year}/${month}/${filename}`,
    relativePath: path.join(safeKind, userId, year, month, filename),
  };
}

export function getMaxUploadBytes() {
  const value = Number.parseInt(process.env.MAX_UPLOAD_BYTES ?? "", 10);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return 10 * 1024 * 1024;
}

export function validateImageUpload({ contentType, sizeBytes }) {
  if (!String(contentType ?? "").toLowerCase().startsWith("image/")) {
    throw new Error("Only image uploads are supported");
  }

  if (sizeBytes > getMaxUploadBytes()) {
    throw new Error("Upload too large");
  }
}

export async function storeUploadedImage(request, { userId, kind, contentType, filename, bodyBuffer }) {
  const timestamp = new Date().toISOString();
  const extension = getExtension(contentType, filename);
  const { storageKey, relativePath } = buildPathParts({
    userId,
    kind,
    timestamp,
    extension,
  });

  const absolutePath = path.join(resolveUploadsRoot(), relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, bodyBuffer);

  return {
    storageKey,
    fileUrl: `${resolvePublicBaseUrl(request)}/uploads/${storageKey}`,
    absolutePath,
  };
}

export async function readUploadedFile(storageKey) {
  const safeKey = path.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, "");
  if (!safeKey || safeKey.startsWith("..")) {
    return null;
  }

  const absolutePath = path.join(resolveUploadsRoot(), safeKey);
  const resolvedRoot = resolveUploadsRoot();
  const resolvedPath = path.resolve(absolutePath);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return null;
  }

  try {
    const file = await fs.readFile(resolvedPath);
    return {
      file,
      absolutePath: resolvedPath,
      contentType: inferContentTypeFromPath(resolvedPath),
    };
  } catch {
    return null;
  }
}

function inferContentTypeFromPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  if (extension === ".heic") return "image/heic";
  if (extension === ".heif") return "image/heif";
  return "application/octet-stream";
}
