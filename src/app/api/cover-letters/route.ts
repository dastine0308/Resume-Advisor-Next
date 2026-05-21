import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, verifyUserOwnsJob } from "@/lib/auth-helper";

export async function POST(req: NextRequest) {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const body = await req.json();
  const { title, job_id, content } = body;

  if (!title || !job_id || !content) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: title, job_id, content" },
      { status: 400 },
    );
  }

  const jobOwnershipError = await verifyUserOwnsJob(supabase!, user!.id, job_id);
  if (jobOwnershipError) return jobOwnershipError;

  // Validate resume ownership if resume_id is given
  if (content.resume_id) {
    const { data: resume } = await supabase!
      .from("resumes")
      .select("user_id")
      .eq("id", content.resume_id)
      .single();
    if (!resume || resume.user_id !== user!.id) {
      return NextResponse.json({ success: false, error: "Invalid resume_id" }, { status: 400 });
    }
  }

  const now = new Date().toISOString();

  // Update existing
  if (body.id) {
    const { data: existing } = await supabase!
      .from("cover_letters")
      .select("user_id")
      .eq("id", body.id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: "Cover letter not found" }, { status: 404 });
    }
    if (existing.user_id !== user!.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await supabase!
      .from("cover_letters")
      .update({ title, job_id, content, last_updated: now })
      .eq("id", body.id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cover_letter_id: body.id, message: "Cover letter updated successfully" });
  }

  // Create new
  const { data: cl, error: insertError } = await supabase!
    .from("cover_letters")
    .insert({ user_id: user!.id, job_id, title, content, creation_date: now, last_updated: now })
    .select("id")
    .single();

  if (insertError || !cl) {
    return NextResponse.json({ success: false, error: insertError?.message ?? "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, cover_letter_id: cl.id, message: "Cover letter saved successfully" }, { status: 201 });
}
