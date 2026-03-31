import { readUploadedFile } from "../storage/uploadStorage.js";
import { uploadOwnedFile } from "../services/uploadService.js";

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export async function createUploadRoute(request, response, database) {
  try {
    const result = await uploadOwnedFile(request, database);

    if (result.type === "unauthorized") {
      json(response, 401, { error: "Authentication required" });
      return;
    }

    json(response, 200, result.payload);
  } catch (error) {
    if (error.message === "Only image uploads are supported") {
      json(response, 415, { error: error.message });
      return;
    }

    if (error.message === "Upload too large") {
      json(response, 413, { error: error.message });
      return;
    }

    console.error("Failed to upload file:", error);
    json(response, 500, { error: "Internal server error" });
  }
}

export async function getUploadedFileRoute(_request, response, storageKey) {
  try {
    const file = await readUploadedFile(storageKey);
    if (!file) {
      response.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    response.writeHead(200, {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    response.end(file.file);
  } catch (error) {
    console.error("Failed to read uploaded file:", error);
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Internal server error" }));
  }
}
