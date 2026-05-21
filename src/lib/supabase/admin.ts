import { createServerClient } from "@supabase/ssr";

// Bypasses RLS — only use in server-side API routes, never expose to client
export function createSupabaseAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Service-role client does not use session cookies
        },
      },
    },
  );
}
