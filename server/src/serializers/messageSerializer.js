function pick(row, snakeKey, camelKey) {
  if (row == null || typeof row !== "object") {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(row, snakeKey)) {
    return row[snakeKey];
  }

  if (Object.prototype.hasOwnProperty.call(row, camelKey)) {
    return row[camelKey];
  }

  return undefined;
}

function serializeTimestamp(value) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

export function serializeMessage(row) {
  return {
    id: pick(row, "id", "id"),
    conversation_id: pick(row, "conversation_id", "conversationId"),
    sender_email: pick(row, "sender_email", "senderEmail"),
    sender_name: pick(row, "sender_name", "senderName") ?? "",
    text: pick(row, "text", "text") ?? "",
    is_read: Boolean(pick(row, "is_read", "isRead")),
    created_date: serializeTimestamp(pick(row, "created_date", "createdDate")),
  };
}
