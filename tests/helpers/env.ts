import { config as loadDotenv } from "dotenv";
import { resolve } from "path";

let loaded = false;

export function loadTestEnv() {
  if (loaded) return;
  loadDotenv({ path: resolve(process.cwd(), ".env.local") });
  loadDotenv({ path: resolve(process.cwd(), ".env") });
  loaded = true;
}

export function getTestBaseUrl() {
  return process.env.TEST_BASE_URL ?? "http://localhost:3000";
}

export function hasIntegrationEnv() {
  loadTestEnv();
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function hasE2eEnv() {
  return hasIntegrationEnv();
}

export async function isAppServerReachable(baseUrl = getTestBaseUrl()) {
  try {
    const res = await fetch(baseUrl, { redirect: "manual" });
    return res.status > 0 && res.status < 600;
  } catch {
    return false;
  }
}

export async function isLatexServiceReachable() {
  loadTestEnv();
  const baseUrl = getTestBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/compile-latex/health`, {
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { ok?: boolean };
    return json.ok === true;
  } catch {
    return false;
  }
}
