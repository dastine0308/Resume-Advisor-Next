import { getTestBaseUrl } from "./env";
import { cookieHeader, type TestCookie } from "./auth";

export type ApiFetchOptions = {
  method?: string;
  cookies?: TestCookie[];
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const baseUrl = getTestBaseUrl();
  const headers: Record<string, string> = { ...options.headers };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.cookies?.length) {
    headers.Cookie = cookieHeader(options.cookies);
  }

  return fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

export async function apiJson<T = unknown>(path: string, options: ApiFetchOptions = {}) {
  const res = await apiFetch(path, options);
  const text = await res.text();
  let json: T | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as T;
    } catch {
      json = null;
    }
  }
  return { res, json, text };
}
