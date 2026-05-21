import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const UNAUTHORIZED = NextResponse.json(
  { success: false, error: "Unauthorized" },
  { status: 401 },
);

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { user: null, supabase: null, error: UNAUTHORIZED };
  return { user, supabase, error: null };
}

/** Ensures the job posting exists and belongs to the given user. */
export async function verifyUserOwnsJob(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
): Promise<NextResponse | null> {
  const { data, error } = await supabase
    .from("job_postings")
    .select("id")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: "Job posting not found" },
      { status: 404 },
    );
  }
  return null;
}
