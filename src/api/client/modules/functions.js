export function createFunctionsCompatModule({ fallbackFunctionsModule }) {
  const compatModule = Object.create(fallbackFunctionsModule);

  async function invokeVerifyRoute(path, payload) {
    const response = await fetch(new URL(path, window.location.origin).toString(), {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload ?? {}),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.message || body.error || `Request failed with ${response.status}`);
    }

    return body;
  }

  Object.assign(compatModule, {
    async invoke(name, payload) {
      if (name === "verify-ucsd-send") {
        return invokeVerifyRoute("/api/verify-ucsd/send", payload);
      }

      if (name === "verify-ucsd-confirm") {
        return invokeVerifyRoute("/api/verify-ucsd/confirm", payload);
      }

      return fallbackFunctionsModule.invoke(name, payload);
    },
  });

  return compatModule;
}
