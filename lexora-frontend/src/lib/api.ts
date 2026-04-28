import { API_BASE } from "./config";
import { getUserIdFromToken } from "./jwt";

const ACCESS = "lexora_access_token";
const REFRESH = "lexora_refresh_token";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS);
}

export function setTokens(access: string, refresh: string | null) {
  localStorage.setItem(ACCESS, access);
  if (refresh) localStorage.setItem(REFRESH, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}

async function refreshAccessToken(): Promise<string | null> {
  const r = localStorage.getItem(REFRESH);
  if (!r) return null;
  const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: r }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };
  if (data.accessToken) {
    setTokens(data.accessToken, data.refreshToken ?? r);
    return data.accessToken;
  }
  return null;
}

export type ApiInit = RequestInit & { skipAuth?: boolean };

export async function apiFetch(
  path: string,
  init: ApiInit = {},
): Promise<Response> {
  const { skipAuth, headers: hdrs, ...rest } = init;
  const headers = new Headers(hdrs);
  if (
    !skipAuth &&
    !headers.has("Authorization") &&
    typeof window !== "undefined"
  ) {
    const token = getStoredAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  let res = await fetch(`${API_BASE}${path}`, { ...rest, headers });

  if (res.status === 401 && !skipAuth && typeof window !== "undefined") {
    const next = await refreshAccessToken();
    if (next) {
      const h2 = new Headers(hdrs);
      h2.set("Authorization", `Bearer ${next}`);
      res = await fetch(`${API_BASE}${path}`, { ...rest, headers: h2 });
    }
  }

  return res;
}

/** For publication routes that need `X-User-ID`. */
export function userHeaderInit(init: ApiInit = {}): ApiInit {
  const token = getStoredAccessToken();
  const uid = getUserIdFromToken(token);
  const headers = new Headers(init.headers);
  if (uid) headers.set("X-User-ID", uid);
  return { ...init, headers };
}

export async function parseJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
