// lib/api/normalize.ts
//
// Internal helper — used ONLY inside api modules to coerce the backend's
// wrapped shapes into what the pages need.
//
// NEVER import this in a page or component. The API layer's job is to
// guarantee the shape the page will see.

export function toArray<T = any>(value: any, keys: string[] = []): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];

  if (typeof value === "object") {
    for (const k of keys) {
      if (Array.isArray((value as any)[k])) return (value as any)[k] as T[];
    }
    for (const k of ["items", "results", "list", "rows", "data"]) {
      if (Array.isArray((value as any)[k])) return (value as any)[k] as T[];
    }
  }
  return [];
}

export function toObject<T = any>(value: any, keys: string[] = []): T | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  for (const k of keys) {
    const v = (value as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v)) return v as T;
  }
  return value as T;
}

export function toPagination(value: any): Pagination | undefined {
  if (!value || typeof value !== "object") return undefined;
  const p = (value as any).pagination ?? (value as any).meta?.pagination;
  if (!p) return undefined;
  return {
    page: Number(p.page ?? 1),
    limit: Number(p.limit ?? 0),
    total: Number(p.total ?? 0),
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}