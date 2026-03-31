import { getSessionUser } from "../auth/session.js";
import { storeUploadedImage, validateImageUpload } from "../storage/uploadStorage.js";

export async function uploadOwnedFile(request, database) {
  const session = await getSessionUser(request, database);
  if (!session) {
    return { type: "unauthorized" };
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const bodyBuffer = Buffer.concat(chunks);
  const contentType = request.headers["content-type"] ?? "";
  const filename = request.headers["x-upload-filename"] ?? "";
  const kindHeader = String(request.headers["x-upload-kind"] ?? "").toLowerCase();
  const kind = kindHeader === "profile" ? "profile" : "listing";

  validateImageUpload({
    contentType,
    sizeBytes: bodyBuffer.byteLength,
  });

  const stored = await storeUploadedImage(request, {
    userId: session.user.id,
    kind,
    contentType,
    filename,
    bodyBuffer,
  });

  return {
    type: "ok",
    payload: {
      file_url: stored.fileUrl,
    },
  };
}
