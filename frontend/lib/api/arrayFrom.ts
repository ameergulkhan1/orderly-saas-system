/**
 * Extracts an array from any API response shape.
 *
 * Handles:
 *   [...]
 *   { data: [...] }
 *   { <key>: [...] }
 *   { data: { <key>: [...] } }
 *   { success, data: { <key>: [...], pagination: {...} } }
 *   { success, data: [...], pagination: {...} }
 *   { items: [...] }  (via fallback keys)
 *   { results: [...] }
 *   { list: [...] }
 *   { rows: [...] }
 *
 * Always returns an array — never throws, never returns undefined.
 *
 * @param res  The raw response from apiFetch (or anything).
 * @param keys Priority keys to look for in the payload (e.g. ["orders", "products"]).
 * @returns    A guaranteed array.
 *
 * @example
 *   const res = await ordersAPI.list();
 *   const list = arrayFrom<Order>(res, ["orders"]);
 *   list.map(...); // ✅ always safe
 */
export function arrayFrom<T = any>(res: any, keys: string[] = []): T[] {
  if (res === null || res === undefined) return [];

  // 1) Already an array
  if (Array.isArray(res)) return res as T[];

  // 2) { data: [...] }
  if (Array.isArray(res?.data)) return res.data as T[];

  // 3) { data: { <key>: [...] } }
  if (res?.data && typeof res.data === "object") {
    for (const k of keys) {
      if (Array.isArray(res.data[k])) return res.data[k] as T[];
    }
    for (const k of ["items", "results", "list", "rows", "data"]) {
      if (Array.isArray(res.data[k])) return res.data[k] as T[];
    }
  }

  // 4) { <key>: [...] }
  if (typeof res === "object") {
    for (const k of keys) {
      if (Array.isArray(res[k])) return res[k] as T[];
    }
    for (const k of ["items", "results", "list", "rows"]) {
      if (Array.isArray(res[k])) return res[k] as T[];
    }
  }

  // 5) Nothing worked — return empty array
  return [];
}

/**
 * Extracts a nested object (e.g. pagination, summary, meta) from a response.
 * Falls back to an empty object.
 *
 * @example
 *   const pagination = metaFrom(res, "pagination");
 *   const summary    = metaFrom(res, "summary");
 */
export function metaFrom(res: any, key = "pagination"): any {
  if (!res) return {};
  if (res?.data && typeof res.data === "object" && res.data[key]) {
    return res.data[key];
  }
  if (typeof res === "object" && res[key]) {
    return res[key];
  }
  return {};
}