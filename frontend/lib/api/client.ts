// lib/api/client.ts
//
// Central HTTP client for the Orderly frontend.
//
// Responsibilities:
//   1. Build absolute URLs to the backend API
//   2. Attach Authorization headers (Bearer token from localStorage)
//   3. Auto-refresh expired access tokens (single-flight concurrency)
//   4. Normalize errors into a consistent shape ({ success, data, error })
//   5. Unwrap the backend's outer envelope (`body.data`) so every caller
//      receives the inner payload directly
//   6. Provide typed request helpers
//
// Non-responsibilities (kept in `api/*.api.ts`):
//   - Unwrapping endpoint-specific wrappers (e.g. `{ orders: [...] }` → `Order[]`)
//   - Business logic
//
// Env:
//   NEXT_PUBLIC_API_URL — full base URL, e.g. http://localhost:4000/api/v1

const API_URL = (() => {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
})();

const REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_HEADERS: Record<string, string> = { Accept: "application/json" };

// ============================================================
// Types
// ============================================================

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: ApiError;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Skip Authorization header (e.g. login/register) */
  skipAuth?: boolean;
  /** Skip auto-refresh on 401 */
  skipRefresh?: boolean;
  /** Custom timeout in ms (default 30000) */
  timeoutMs?: number;
  /** JSON body — auto-serialized */
  json?: unknown;
  /** Raw body — passed through as-is */
  body?: BodyInit | null;
  /** Query string params — auto-appended */
  query?: Record<string, unknown>;
  /** Internal — prevents infinite 401 retry loop */
  _retry?: boolean;
}

// ============================================================
// Storage keys
// ============================================================

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "user";
const BUSINESS_KEY = "business";

// ============================================================
// SSR-safe storage helpers
// ============================================================

const canUseStorage = (): boolean => typeof window !== "undefined";

function safeGet(key: string): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota / privacy mode — ignore */
  }
}

function safeRemove(key: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ============================================================
// Token / user / business management
// ============================================================

export const getAccessToken = (): string | null => safeGet(ACCESS_KEY);
export const getRefreshToken = (): string | null => safeGet(REFRESH_KEY);

export const setTokens = (access: string, refresh: string): void => {
  safeSet(ACCESS_KEY, access);
  safeSet(REFRESH_KEY, refresh);
};

export const setStoredUser = (user: unknown): void => {
  safeSet(USER_KEY, JSON.stringify(user));
};

export const setStoredBusiness = (business: unknown): void => {
  safeSet(BUSINESS_KEY, JSON.stringify(business));
};

export const getStoredUser = <T = unknown>(): T | null =>
  safeParse<T>(safeGet(USER_KEY));

export const getStoredBusiness = <T = unknown>(): T | null =>
  safeParse<T>(safeGet(BUSINESS_KEY));

export const clearTokens = (): void => {
  safeRemove(ACCESS_KEY);
  safeRemove(REFRESH_KEY);
  safeRemove(USER_KEY);
  safeRemove(BUSINESS_KEY);
};

export const isAuthenticated = (): boolean => !!getAccessToken();

// ============================================================
// Query string builder
// ============================================================

/**
 * Build a query string from any flat object.
 *
 * Accepts any object shape (typed or plain) — this is why the parameter is
 * typed as `object` rather than `Record<string, unknown>`, so that typed
 * interfaces (e.g. PaginationParams & { status?: OrderStatus }) are accepted
 * without casts.
 *
 * Skips `undefined`, `null`, and empty-string values.
 * Expands arrays into repeated params: `?a=1&a=2`.
 * ISO-stringifies Date instances.
 * Silently skips nested objects.
 *
 * @example
 *   buildQuery({ page: 1, status: "NEW", tags: ["a","b"] })
 *   // → "?page=1&status=NEW&tags=a&tags=b"
 */
export function buildQuery(params?: object): string {
  if (!params) return "";

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        search.append(key, String(item));
      }
      continue;
    }

    if (value instanceof Date) {
      search.append(key, value.toISOString());
      continue;
    }

    if (typeof value === "object") {
      // Nested objects are not supported in query strings — skip silently.
      continue;
    }

    search.append(key, String(value));
  }

  const s = search.toString();
  return s ? `?${s}` : "";
}

// ============================================================
// Timeout wrapper
// ============================================================

class TimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  if (timeoutMs <= 0 || typeof AbortController === "undefined") {
    return fetch(input, init);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === "AbortError") throw new TimeoutError();
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// Single-flight token refresh
// ============================================================

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<boolean> => {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await fetchWithTimeout(
        `${API_URL}/auth/refresh-token`,
        {
          method: "POST",
          headers: { ...DEFAULT_HEADERS, "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        },
        15_000
      );

      if (!res.ok) return false;

      const body = await res.json().catch(() => null);
      const payload = body?.data ?? body;
      const tokens =
        payload?.tokens ?? (payload?.accessToken ? payload : null);

      if (!tokens?.accessToken) return false;

      setTokens(tokens.accessToken, tokens.refreshToken ?? refresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ============================================================
// Redirect to login (single entry point)
// ============================================================

let isRedirecting = false;

function redirectToLogin(): void {
  if (!canUseStorage() || isRedirecting) return;
  isRedirecting = true;
  clearTokens();

  const current = window.location.pathname + window.location.search;
  const loginUrl = `/login?redirect=${encodeURIComponent(current)}`;

  window.location.href = loginUrl;
}

// ============================================================
// Response parsing
// ============================================================

async function parseResponseBody(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  if (
    contentType.includes("text/") ||
    contentType.includes("application/xml")
  ) {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }

  // binary (blob) — return null; caller can use a lower-level helper if needed
  return null;
}

function normalizeError(
  body: any,
  res: Response | null,
  fallbackMessage: string
): ApiError {
  // Backend envelope: { success: false, error: { message, code, details } }
  if (body?.error && typeof body.error === "object") {
    return {
      message: body.error.message ?? fallbackMessage,
      code: body.error.code,
      details: body.error.details,
      status: res?.status,
    };
  }

  // Backend alternative: { success: false, message: "..." }
  if (body?.message && typeof body.message === "string") {
    return {
      message: body.message,
      status: res?.status,
    };
  }

  // Zod-style validation array
  if (Array.isArray(body?.errors) && body.errors.length > 0) {
    const first = body.errors[0];
    return {
      message: first?.message ?? fallbackMessage,
      details: body.errors,
      status: res?.status,
    };
  }

  // HTTP status text
  if (res && !res.ok) {
    return {
      message: fallbackMessage || `Request failed (${res.status})`,
      status: res.status,
    };
  }

  return { message: fallbackMessage };
}

// ============================================================
// Core fetch
// ============================================================

/**
 * Perform an API request.
 *
 * - Automatically attaches Authorization header
 * - Unwraps `body.data` from the backend's outer envelope
 * - Handles 401 → single-flight refresh → retry once
 * - Normalizes errors into `{ success, data, error }`
 * - Times out after `timeoutMs` (default 30s)
 *
 * @example
 *   const res = await apiFetch<Order[]>("/orders");
 *   if (!res.success) console.error(res.error?.message);
 *   else res.data.forEach(...);
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    skipAuth = false,
    skipRefresh = false,
    timeoutMs = REQUEST_TIMEOUT_MS,
    json,
    body,
    query,
    headers: initHeaders,
    _retry = false,
    ...rest
  } = options;

  // Build final URL
  const url = `${API_URL}${path}${buildQuery(query)}`;

  // Build headers
  const headers = new Headers(initHeaders ?? {});
  if (!headers.has("Accept")) headers.set("Accept", DEFAULT_HEADERS.Accept);
  if (json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // Build init
  const init: RequestInit = {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : body ?? undefined,
  };

  // ---------- Perform request ----------
  let res: Response;
  try {
    res = await fetchWithTimeout(url, init, timeoutMs);
  } catch (err: any) {
    // Network error or timeout
    const isTimeout = err instanceof TimeoutError;
    return {
      success: false,
      data: undefined as unknown as T,
      error: {
        message: isTimeout
          ? "Request timed out. Please try again."
          : err?.message || "Network error. Please check your connection.",
        code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
      },
    };
  }

  // ---------- Handle 401 with single retry ----------
  if (res.status === 401 && !_retry && !skipRefresh && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retry: true });
    }
    redirectToLogin();
    return {
      success: false,
      data: undefined as unknown as T,
      error: {
        message: "Session expired. Please sign in again.",
        status: 401,
      },
    };
  }

  // ---------- Parse body ----------
  const parsed = await parseResponseBody(res);

  // ---------- Determine success ----------
  const success = res.ok && (parsed?.success ?? true);

  if (!success) {
    return {
      success: false,
      data: undefined as unknown as T,
      error: normalizeError(parsed, res, "Request failed"),
    };
  }

  // ---------- Unwrap outer envelope ----------
  // Backend returns: { success: true, data: <payload> }
  // We return `parsed.data` — or `parsed` if there's no `.data` field.
  const payload =
    parsed && typeof parsed === "object" && "data" in parsed
      ? parsed.data
      : parsed;

  return {
    success: true,
    data: payload as T,
  };
}

// ============================================================
// Convenience wrappers
// ============================================================

export const apiGet = <T = unknown>(
  path: string,
  options?: Omit<RequestOptions, "method" | "json" | "body">
): Promise<ApiResponse<T>> =>
  apiFetch<T>(path, { ...options, method: "GET" });

export const apiPost = <T = unknown>(
  path: string,
  json?: unknown,
  options?: Omit<RequestOptions, "method" | "json" | "body">
): Promise<ApiResponse<T>> =>
  apiFetch<T>(path, { ...options, method: "POST", json });

export const apiPatch = <T = unknown>(
  path: string,
  json?: unknown,
  options?: Omit<RequestOptions, "method" | "json" | "body">
): Promise<ApiResponse<T>> =>
  apiFetch<T>(path, { ...options, method: "PATCH", json });

export const apiPut = <T = unknown>(
  path: string,
  json?: unknown,
  options?: Omit<RequestOptions, "method" | "json" | "body">
): Promise<ApiResponse<T>> =>
  apiFetch<T>(path, { ...options, method: "PUT", json });

export const apiDelete = <T = unknown>(
  path: string,
  options?: Omit<RequestOptions, "method" | "json" | "body">
): Promise<ApiResponse<T>> =>
  apiFetch<T>(path, { ...options, method: "DELETE" });