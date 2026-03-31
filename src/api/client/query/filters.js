export function toListingsQueryParams(filter = {}, sort, limit) {
  const query = {};

  if (filter.id && typeof filter.id === "object" && Array.isArray(filter.id.$in)) {
    query.ids = filter.id.$in.join(",");
  } else if (typeof filter.id === "string") {
    query.id = filter.id;
  }

  if (typeof filter.seller_email === "string") {
    query.sellerEmail = filter.seller_email;
  }

  if (typeof filter.status === "string") {
    query.status = filter.status;
  }

  if (sort) {
    query.sort = sort;
  }

  if (limit != null) {
    query.limit = limit;
  }

  return query;
}
