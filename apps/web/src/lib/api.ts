/**
 * Cliente HTTP de la API. Maneja el envío del access token y el refresh
 * automático y transparente cuando el access token expira (401).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const ACCESS_KEY = "cv_access_token";
const REFRESH_KEY = "cv_refresh_token";

export const tokenStore = {
  get access() {
    return typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null;
  },
  get refresh() {
    return typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

interface ApiSuccess<T> {
  ok: true;
  data: T;
}
interface ApiFailure {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}

async function parse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiSuccess<T> | ApiFailure;
  if (!res.ok || !json.ok) {
    const err = "error" in json ? json.error : { code: "UNKNOWN", message: "Error desconocido" };
    throw new ApiError(res.status, err.code, err.message, "details" in err ? err.details : undefined);
  }
  return json.data;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as ApiSuccess<{ accessToken: string; refreshToken: string }>;
    tokenStore.set(json.data.accessToken, json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  /** Interno: evita bucle de refresh. */
  _retried?: boolean;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Access expirado: intenta refrescar una vez y reintenta.
  if (res.status === 401 && auth && !opts._retried) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch<T>(path, { ...opts, _retried: true });
  }

  return parse<T>(res);
}
