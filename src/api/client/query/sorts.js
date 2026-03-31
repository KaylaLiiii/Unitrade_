const SUPPORTED_SORTS = new Set([
  "created_date",
  "-created_date",
  "updated_date",
  "-updated_date",
]);

export function toListingsSort(sort) {
  if (!sort) {
    return null;
  }

  if (!SUPPORTED_SORTS.has(sort)) {
    throw new Error(`Unsupported listing sort: ${sort}`);
  }

  return sort;
}
