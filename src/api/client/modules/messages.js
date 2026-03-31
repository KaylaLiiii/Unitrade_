import { httpGetJson, httpSendJson } from "../httpClient";

function toMessageQuery(filter, sort, limit) {
  return {
    conversation_id: typeof filter?.conversation_id === "string" ? filter.conversation_id : null,
    sort: typeof sort === "string" ? sort : null,
    limit: limit ?? null,
  };
}

export function createMessageCompatModule({ fallbackMessageModule }) {
  const compatModule = Object.create(fallbackMessageModule);

  Object.assign(compatModule, {
    async filter(filter, sort, limit) {
      const query = toMessageQuery(filter, sort, limit);
      const conversationId = query.conversation_id;
      if (!conversationId) {
        return [];
      }

      const response = await httpGetJson(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
        query: {
          sort: query.sort,
          limit: query.limit,
        },
      });
      return Array.isArray(response.items) ? response.items : [];
    },

    async create(payload, _options) {
      const response = await httpSendJson(
        `/api/conversations/${encodeURIComponent(payload.conversation_id)}/messages`,
        {
          method: "POST",
          body: payload,
        }
      );
      return response.item;
    },

    async update(id, payload, _options) {
      const response = await httpSendJson(`/api/messages/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: payload,
      });
      return response.item;
    },
  });

  return compatModule;
}
