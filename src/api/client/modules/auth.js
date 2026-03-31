import { httpGetJson, httpPatchJson } from "../httpClient";

export function createAuthCompatModule({ fallbackAuthModule }) {
  const compatModule = Object.create(fallbackAuthModule);

  Object.assign(compatModule, {
    async isAuthenticated() {
      const response = await httpGetJson("/api/session");
      return Boolean(response.isAuthenticated);
    },

    async me() {
      const response = await httpGetJson("/api/me");
      return response.user;
    },

    async updateMe(payload) {
      const response = await httpPatchJson("/api/me", payload);
      return response.user;
    },

    redirectToLogin(returnTo) {
      const target = new URL("/api/auth/google/start", window.location.origin);
      target.searchParams.set("returnTo", returnTo || window.location.href);
      window.location.assign(target.toString());
    },

    logout(returnTo) {
      const target = new URL("/api/auth/logout", window.location.origin);
      target.searchParams.set("returnTo", returnTo || "/");
      fetch(target.toString(), {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: {
          Accept: "application/json",
        },
      }).then(async (response) => {
        if (!returnTo) {
          const payload = await response.json().catch(() => ({}));
          if (payload.redirectTo) {
            window.location.assign(payload.redirectTo);
          }
        }
      }).catch(() => {});
    },
  });

  return compatModule;
}
