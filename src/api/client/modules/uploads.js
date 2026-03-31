export function createUploadsCompatModule({ fallbackIntegrationsModule }) {
  const compatIntegrations = Object.create(fallbackIntegrationsModule ?? {});
  const fallbackCore = fallbackIntegrationsModule?.Core ?? {};
  const compatCore = Object.create(fallbackCore);

  async function uploadOwnedFile({ file }) {
    const pathname = window.location.pathname || "";
    const kind = pathname.toLowerCase().includes("profile") ? "profile" : "listing";

    const response = await fetch(new URL("/api/uploads", window.location.origin).toString(), {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": file?.type || "application/octet-stream",
        "X-Upload-Filename": file?.name || "upload.bin",
        "X-Upload-Kind": kind,
      },
      body: file,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `Request failed with ${response.status}`);
      error.status = response.status;
      error.data = payload;
      throw error;
    }

    return payload;
  }

  compatCore.UploadFile = uploadOwnedFile;
  compatIntegrations.Core = compatCore;
  return compatIntegrations;
}
