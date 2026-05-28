import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  // Fetch the original resume
  const { data: original } = await supabase!
    .from("resumes")
    .select("user_id, job_id, title, content, creation_date")
    .eq("id", id)
    .single();

  if (!original) {
    return NextResponse.json(
      { success: false, error: "Resume not found" },
      { status: 404 },
    );
  }
  if (original.user_id !== user!.id) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const now = new Date().toISOString();
  const newTitle = `Copy of ${original.title}`;

  // Create a new resume with the same content
  const { data: cloned, error: insertError } = await supabase!
    .from("resumes")
    .insert({
      user_id: user!.id,
      job_id: original.job_id,
      title: newTitle,
      content: original.content,
      creation_date: now,
      last_updated: now,
    })
    .select("id")
    .single();

  if (insertError || !cloned) {
    return NextResponse.json(
      { success: false, error: insertError?.message ?? "Clone failed" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      resume_id: cloned.id,
      message: "Resume cloned successfully",
    },
    { status: 201 },
  );
}
