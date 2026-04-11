function normalizeBaseUrl(url: string | undefined, fallback: string) {
  const value = (url ?? fallback).trim().replace(/\/+$/, "");
  return value.endsWith("/api") ? value.slice(0, -4) : value;
}

export const CLIENT_API_BASE = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL,
  "http://localhost:8080",
);

export const SERVER_API_BASE = normalizeBaseUrl(
  process.env.INTERNAL_API_URL,
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
);

export const API_BASE =
  typeof window === "undefined" ? SERVER_API_BASE : CLIENT_API_BASE;
