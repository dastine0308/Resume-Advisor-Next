import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, verifyUserOwnsJob } from "@/lib/auth-helper";
import { maybeCreateResumeVersion, getVersionBaselineContent } from "@/lib/resume-versions";
import { summarizeSectionChanges } from "@/lib/resume-version-diff";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ResumeVersionSource } from "@/lib/resume-versions";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function createVersionSnapshot(
  supabase: SupabaseClient,
  params: {
    userId: string;
    resumeId: string;
    title: string;
    sections: Record<string, unknown>;
    source: ResumeVersionSource;
    label: string | null;
    previousContent: Record<string, unknown> | null;
  },
) {
  const baseline = await getVersionBaselineContent(
    supabase,
    params.resumeId,
    params.previousContent,
  );
  return maybeCreateResumeVersion(supabase, {
    userId: params.userId,
    resumeId: params.resumeId,
    title: params.title,
    content: params.sections,
    source: params.source,
    label: params.label,
    changeSummary: summarizeSectionChanges(baseline, params.sections),
  });
}

export async function POST(req: NextRequest) {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const body = await req.json();
  const { title, job_id, sections } = body;

  if (!title || !job_id || !sections) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: title, job_id, sections" },
      { status: 400 },
    );
  }

  const ownershipError = await verifyUserOwnsJob(supabase!, user!.id, job_id);
  if (ownershipError) return ownershipError;

  const now = new Date().toISOString();
  const versionSource: ResumeVersionSource =
    body.version_source === "manual" ? "manual" : "autosave";
  const versionLabel =
    typeof body.version_label === "string" ? body.version_label.trim() : null;

  // Update existing resume
  if (body.id) {
    const { data: existing } = await supabase!
      .from("resumes")
      .select("user_id, content")
      .eq("id", body.id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    }
    if (existing.user_id !== user!.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const previousContent = (existing.content as Record<string, unknown> | null) ?? null;

    const { error: updateError } = await supabase!
      .from("resumes")
      .update({ title, job_id, content: sections, last_updated: now })
      .eq("id", body.id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    const versionResult = await createVersionSnapshot(supabase!, {
      userId: user!.id,
      resumeId: body.id,
      title,
      sections,
      source: versionSource,
      label: versionLabel,
      previousContent,
    });

    return NextResponse.json({
      success: true,
      resume_id: body.id,
      message: "Resume updated successfully",
      version_created: versionResult.created,
      version_error: versionResult.error ?? null,
    });
  }

  // Create new resume
  const { data: resume, error: insertError } = await supabase!
    .from("resumes")
    .insert({
      user_id: user!.id,
      job_id,
      title,
      content: sections,
      creation_date: now,
      last_updated: now,
    })
    .select("id")
    .single();

  if (insertError || !resume) {
    return NextResponse.json(
      { success: false, error: insertError?.message ?? "Insert failed" },
      { status: 500 },
    );
  }

  const versionResult =
    versionSource === "manual"
      ? await createVersionSnapshot(supabase!, {
          userId: user!.id,
          resumeId: resume.id,
          title,
          sections,
          source: "manual",
          label: versionLabel,
          previousContent: null,
        })
      : { created: false as const, error: undefined };

  return NextResponse.json(
    {
      success: true,
      resume_id: resume.id,
      message: "Resume saved successfully",
      version_created: versionResult.created,
      version_error: versionResult.error ?? null,
    },
    { status: 201 },
  );
}
