import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";

export async function GET() {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("resumes")
    .select("id, title, job_id, last_updated")
    .eq("user_id", user!.id)
    .order("last_updated", { ascending: false });

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [], count: data?.length ?? 0 });
}
