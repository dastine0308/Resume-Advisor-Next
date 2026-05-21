import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { maybeCreateResumeVersion } from "@/lib/resume-versions";
import { summarizeSectionChanges } from "@/lib/resume-version-diff";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { id: resumeId, versionId } = await params;
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { data: resume, error: resumeError } = await supabase!
    .from("resumes")
    .select("user_id")
    .eq("id", resumeId)
    .single();

  if (resumeError || !resume) {
    return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
  }
  if (resume.user_id !== user!.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { data: version, error: versionError } = await supabase!
    .from("resume_versions")
    .select("id, title, content, user_id")
    .eq("id", versionId)
    .eq("resume_id", resumeId)
    .single();

  if (versionError || !version) {
    return NextResponse.json({ success: false, error: "Version not found" }, { status: 404 });
  }
  if (version.user_id !== user!.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { data: currentResume } = await supabase!
    .from("resumes")
    .select("title, content")
    .eq("id", resumeId)
    .single();

  if (currentResume?.content) {
    const currentContent = currentResume.content as Record<string, unknown>;
    await maybeCreateResumeVersion(supabase!, {
      userId: user!.id,
      resumeId,
      title: currentResume.title,
      content: currentContent,
      source: "manual",
      label: "Before restore",
      changeSummary: summarizeSectionChanges(
        currentContent,
        version.content as Record<string, unknown>,
      ),
    });
  }

  const now = new Date().toISOString();
  const sections = version.content as Record<string, unknown>;

  const { error: updateError } = await supabase!
    .from("resumes")
    .update({ title: version.title, content: sections, last_updated: now })
    .eq("id", resumeId);

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      title: version.title,
      sections,
    },
    message: "Resume restored successfully",
  });
}
