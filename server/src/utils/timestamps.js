export function toTimestampValue(value) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp value: ${String(value)}`);
  }

  return parsed;
}

export function nowTimestamp() {
  return new Date();
}
