import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { loadTestEnv } from "./env";

export type TestCookie = { name: string; value: string };

export type TestSession = {
  userId: string;
  email: string;
  password: string;
  cookies: TestCookie[];
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function createSupabaseAdmin() {
  loadTestEnv();
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function createTestSession(): Promise<TestSession> {
  loadTestEnv();
  const email = `e2e-${Date.now()}-${randomUUID().slice(0, 8)}@resume-advisor.test`;
  const password = `Test-${randomUUID()}!Aa1`;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message ?? "unknown"}`);
  }

  const cookieStore: TestCookie[] = [];
  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore;
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            const idx = cookieStore.findIndex((c) => c.name === name);
            if (idx >= 0) cookieStore[idx].value = value;
            else cookieStore.push({ name, value });
          }
        },
      },
    },
  );

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(`Failed to sign in test user: ${signInError.message}`);
  }

  return {
    userId: data.user.id,
    email,
    password,
    cookies: cookieStore,
  };
}

export async function deleteTestUser(userId: string) {
  const admin = createSupabaseAdmin();
  await admin.auth.admin.deleteUser(userId);
}

export function cookieHeader(cookies: TestCookie[]) {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

export function toPlaywrightCookies(cookies: TestCookie[], baseUrl: string) {
  const { hostname, protocol } = new URL(baseUrl);
  return cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: hostname,
    path: "/",
    expires: -1,
    httpOnly: false,
    secure: protocol === "https:",
    sameSite: "Lax" as const,
  }));
}
