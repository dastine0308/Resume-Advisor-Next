import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { listResumeVersions } from "@/lib/resume-versions";

async function verifyResumeOwnership(
  supabase: NonNullable<Awaited<ReturnType<typeof getAuthUser>>["supabase"]>,
  resumeId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("resumes")
    .select("user_id")
    .eq("id", resumeId)
    .single();

  if (error || !data) {
    return { error: NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 }) };
  }
  if (data.user_id !== userId) {
    return { error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { error: null };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const ownership = await verifyResumeOwnership(supabase!, id, user!.id);
  if (ownership.error) return ownership.error;

  try {
    const versions = await listResumeVersions(supabase!, id, user!.id);
    return NextResponse.json({ success: true, data: versions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list resume versions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
