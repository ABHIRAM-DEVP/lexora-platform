export type JwtPayload = {
  sub: string;
  role?: string;
  exp?: number;
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getRoleFromToken(token: string | null): string | null {
  if (!token) return null;
  return decodeJwtPayload(token)?.role ?? null;
}

export function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  return decodeJwtPayload(token)?.sub ?? null;
}
