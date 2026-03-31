import { httpGetJson, httpSendJson } from "../httpClient";
import { toListingsQueryParams } from "../query/filters";
import { toListingsSort } from "../query/sorts";

export function createListingCompatModule({ fallbackListingModule }) {
  const compatModule = Object.create(fallbackListingModule);

  Object.assign(compatModule, {
    async list(sort, limit) {
      const query = toListingsQueryParams({}, toListingsSort(sort), limit);
      const response = await httpGetJson("/api/listings", { query });
      return Array.isArray(response.items) ? response.items : [];
    },

    async filter(filter, sort, limit) {
      const query = toListingsQueryParams(filter, toListingsSort(sort), limit);
      const response = await httpGetJson("/api/listings", { query });
      return Array.isArray(response.items) ? response.items : [];
    },

    async create(payload) {
      const response = await httpSendJson("/api/listings", {
        method: "POST",
        body: payload,
      });
      return response.item;
    },

    async update(id, payload) {
      const response = await httpSendJson(`/api/listings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: payload,
      });
      return response.item;
    },

    async delete(id) {
      await httpSendJson(`/api/listings/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  });

  return compatModule;
}
