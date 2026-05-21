import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("resumes")
    .select("id, user_id, job_id, title, content, creation_date, last_updated")
    .eq("id", id)
    .single();

  if (dbError || !data) {
    return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
  }
  if (data.user_id !== user!.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: data.id,
      title: data.title,
      job_id: data.job_id,
      creation_date: data.creation_date,
      last_updated: data.last_updated,
      sections: data.content,
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { data: existing } = await supabase!
    .from("resumes")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
  }
  if (existing.user_id !== user!.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await supabase!
    .from("cover_letters")
    .delete()
    .contains("content", { resume_id: id })
    .eq("user_id", user!.id);

  const { error: dbError } = await supabase!.from("resumes").delete().eq("id", id);
  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Resume deleted successfully" });
}
