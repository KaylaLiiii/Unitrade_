import { httpGetJson, httpSendJson } from "../httpClient";

function toSavedListingsQuery(filter, _sort, _limit) {
  return {
    user_email: typeof filter?.user_email === "string" ? filter.user_email : null,
    listing_id: typeof filter?.listing_id === "string" ? filter.listing_id : null,
  };
}

export function createSavedListingCompatModule({ fallbackSavedListingModule }) {
  const compatModule = Object.create(fallbackSavedListingModule);

  Object.assign(compatModule, {
    async filter(filter, sort, limit) {
      const response = await httpGetJson("/api/saved-listings", {
        query: toSavedListingsQuery(filter, sort, limit),
      });
      return Array.isArray(response.items) ? response.items : [];
    },

    async create(payload) {
      const response = await httpSendJson("/api/saved-listings", {
        method: "POST",
        body: payload,
      });
      return response.item;
    },

    async delete(id) {
      await httpSendJson(`/api/saved-listings/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  });

  return compatModule;
}
