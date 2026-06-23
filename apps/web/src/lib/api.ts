/**
 * Cliente HTTP de la API. Maneja el envío del access token y el refresh
 * automático y transparente cuando el access token expira (401).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// El access token vive solo en memoria (no en localStorage) para reducir la
// superficie de XSS. El refresh token viaja en una cookie httpOnly que el JS
// no puede leer; el navegador la envía sola gracias a credentials: "include".
let accessToken: string | null = null;

export const tokenStore = {
  get access() {
    return accessToken;
  },
  set(token: string) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
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

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // envía la cookie httpOnly del refresh token
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return false;
    const json = (await res.json()) as ApiSuccess<{ accessToken: string }>;
    tokenStore.set(json.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// Single-flight: si llegan varios 401 a la vez, comparten un único refresh
// para no rotar el token en paralelo (lo que invalidaría las demás peticiones).
let refreshInFlight: Promise<boolean> | null = null;
function tryRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
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
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Access expirado: intenta refrescar una vez y reintenta.
  if (res.status === 401 && auth && !opts._retried) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch<T>(path, { ...opts, _retried: true });
  }

  return parse<T>(res);
}
