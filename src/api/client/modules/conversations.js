import { httpGetJson, httpSendJson } from "../httpClient";

function toConversationQuery(filter, sort, limit) {
  return {
    buyer_email: typeof filter?.buyer_email === "string" ? filter.buyer_email : null,
    seller_email: typeof filter?.seller_email === "string" ? filter.seller_email : null,
    sort: typeof sort === "string" ? sort : null,
    limit: limit ?? null,
  };
}

export function createConversationCompatModule({ fallbackConversationModule }) {
  const compatModule = Object.create(fallbackConversationModule);

  Object.assign(compatModule, {
    async filter(filter, sort, limit) {
      const response = await httpGetJson("/api/conversations", {
        query: toConversationQuery(filter, sort, limit),
      });
      return Array.isArray(response.items) ? response.items : [];
    },

    async create(payload, _options) {
      const response = await httpSendJson("/api/conversations", {
        method: "POST",
        body: payload,
      });
      return response.item;
    },

    async update(id, payload, _options) {
      const response = await httpSendJson(`/api/conversations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: payload,
      });
      return response.item;
    },
  });

  return compatModule;
}
