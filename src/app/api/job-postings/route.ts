import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, verifyUserOwnsJob } from "@/lib/auth-helper";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function POST(req: NextRequest) {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid or empty request body" },
      { status: 400 },
    );
  }

  // Update existing job posting
  if (body.job_id) {
    const jobId = body.job_id as string;

    const ownershipError = await verifyUserOwnsJob(supabase!, user!.id, jobId);
    if (ownershipError) return ownershipError;

    const { data: existing } = await supabase!
      .from("job_postings")
      .select("id, company_id")
      .eq("id", jobId)
      .eq("user_id", user!.id)
      .single();
    if (!existing) {
      return NextResponse.json({ success: false, error: "Job posting not found" }, { status: 404 });
    }

    const companyUpdates: Record<string, unknown> = {};
    if (body.company_name !== undefined) companyUpdates.name = body.company_name;
    if (body.company_location !== undefined) companyUpdates.location = body.company_location;
    if (body.company_industry !== undefined) companyUpdates.industry = body.company_industry;
    if (body.company_website !== undefined) companyUpdates.website = body.company_website;

    if (Object.keys(companyUpdates).length > 0) {
      const { error: companyErr } = await supabase!
        .from("company")
        .update(companyUpdates)
        .eq("id", existing.company_id);
      if (companyErr) {
        return NextResponse.json(
          { success: false, error: companyErr.message },
          { status: 500 },
        );
      }
    }

    const jobUpdates: Record<string, unknown> = {};
    if (body.title) jobUpdates.title = body.title;
    if (body.description !== undefined) jobUpdates.description = body.description;
    if (body.job_location !== undefined) jobUpdates.job_location = body.job_location;
    if (body.close_date !== undefined) jobUpdates.close_date = body.close_date || null;

    if (Object.keys(jobUpdates).length > 0) {
      const { error: jobErr } = await supabase!
        .from("job_postings")
        .update(jobUpdates)
        .eq("id", jobId)
        .eq("user_id", user!.id);
      if (jobErr) {
        return NextResponse.json(
          { success: false, error: jobErr.message },
          { status: 500 },
        );
      }
    }

    if (
      body.requirements !== undefined ||
      body.selected_requirements !== undefined
    ) {
      const { error: deleteErr } = await supabase!
        .from("job_requirements")
        .delete()
        .eq("job_id", jobId);
      if (deleteErr) {
        return NextResponse.json(
          { success: false, error: deleteErr.message },
          { status: 500 },
        );
      }

      const reqError = await insertRequirements(
        supabase!,
        jobId,
        (body.requirements as unknown[] | undefined) ?? [],
        (body.selected_requirements as unknown[] | undefined) ?? [],
      );
      if (reqError) {
        return NextResponse.json(
          { success: false, error: reqError },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      job_id: jobId,
      message: "Job posting updated successfully",
    });
  }

  // Create new job posting
  const { title, company_name, job_location } = body;
  if (!title || !company_name || !job_location) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: title, company_name, job_location" },
      { status: 400 },
    );
  }

  const { data: company, error: companyError } = await supabase!
    .from("company")
    .insert({
      name: company_name,
      location: body.company_location ?? null,
      industry: body.company_industry ?? null,
      website: body.company_website ?? null,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    return NextResponse.json(
      { success: false, error: companyError?.message ?? "Company insert failed" },
      { status: 500 },
    );
  }

  const { data: job, error: jobError } = await supabase!
    .from("job_postings")
    .insert({
      title,
      company_id: company.id,
      description: body.description ?? null,
      job_location,
      posted_date: body.posted_date ?? new Date().toISOString().slice(0, 10),
      close_date: body.close_date ?? null,
      user_id: user!.id,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { success: false, error: jobError?.message ?? "Job insert failed" },
      { status: 500 },
    );
  }

  const reqError = await insertRequirements(
    supabase!,
    job.id,
    (body.requirements as unknown[] | undefined) ?? [],
    (body.selected_requirements as unknown[] | undefined) ?? [],
  );
  if (reqError) {
    return NextResponse.json({ success: false, error: reqError }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, job_id: job.id, message: "Job posting created successfully" },
    { status: 201 },
  );
}

async function insertRequirements(
  supabase: SupabaseClient,
  jobId: unknown,
  requirements: unknown[],
  selectedRequirements: unknown[],
): Promise<string | null> {
  const selectedSet = new Set(
    (selectedRequirements as string[])
      .map((r) => r.trim())
      .filter(Boolean),
  );

  const allRequirements = new Set<string>();
  for (const r of [...(requirements as string[]), ...(selectedRequirements as string[])]) {
    const trimmed = r.trim();
    if (trimmed) allRequirements.add(trimmed);
  }

  if (allRequirements.size === 0) return null;

  const rows = [...allRequirements].map((requirement) => ({
    job_id: jobId,
    requirement,
    is_selected: selectedSet.has(requirement),
  }));

  const { error } = await supabase.from("job_requirements").insert(rows);
  return error?.message ?? null;
}
