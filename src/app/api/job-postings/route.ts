import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, verifyUserOwnsJob } from "@/lib/auth-helper";
import {
  canPersistJobPosting,
  isUnknownField,
  LOW_QUALITY_JOB_PERSIST_ERROR,
  nullIfUnknown,
  unknownFieldPersistError,
} from "@/lib/job-analysis-quality";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function lowQualityResponse() {
  return NextResponse.json(
    { success: false, error: LOW_QUALITY_JOB_PERSIST_ERROR, code: "LOW_QUALITY_INPUT" },
    { status: 422 },
  );
}

function rejectIfUnknownField(
  field: unknown,
  label: string,
): NextResponse | null {
  if (field === undefined) return null;
  if (isUnknownField(String(field))) {
    return NextResponse.json(
      {
        success: false,
        error: unknownFieldPersistError(label),
        code: "LOW_QUALITY_INPUT",
      },
      { status: 422 },
    );
  }
  return null;
}

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
      .select("id, company_id, title, job_location, company ( name )")
      .eq("id", jobId)
      .eq("user_id", user!.id)
      .single();
    if (!existing) {
      return NextResponse.json({ success: false, error: "Job posting not found" }, { status: 404 });
    }

    let existingRequirements: string[] = [];
    if (body.requirements === undefined) {
      const { data: requirementRows } = await supabase!
        .from("job_requirements")
        .select("requirement")
        .eq("job_id", jobId);
      existingRequirements =
        requirementRows?.map((row) => String(row.requirement)).filter(Boolean) ?? [];
    }

    const hasAnyUpdate =
      body.title !== undefined ||
      body.company_name !== undefined ||
      body.job_location !== undefined ||
      body.description !== undefined ||
      body.requirements !== undefined ||
      body.selected_requirements !== undefined ||
      body.company_location !== undefined ||
      body.company_industry !== undefined ||
      body.company_website !== undefined ||
      body.close_date !== undefined;

    if (hasAnyUpdate) {
      const existingCompanyName = String(
        (existing.company as { name?: string } | null)?.name ?? "",
      ).trim();
      const effectiveTitle =
        body.title !== undefined
          ? String(body.title).trim()
          : String(existing.title ?? "").trim();
      const effectiveCompanyName =
        body.company_name !== undefined
          ? String(body.company_name).trim()
          : existingCompanyName;
      const effectiveLocation =
        body.job_location !== undefined
          ? String(body.job_location).trim()
          : String(existing.job_location ?? "").trim();
      const effectiveRequirements =
        body.requirements !== undefined
          ? ((body.requirements as string[] | undefined) ?? [])
          : existingRequirements;

      if (
        !canPersistJobPosting({
          title: effectiveTitle,
          company_name: effectiveCompanyName,
          job_location: effectiveLocation,
          requirements: effectiveRequirements,
        })
      ) {
        return lowQualityResponse();
      }
    }

    const companyUpdates: Record<string, unknown> = {};
    if (body.company_name !== undefined) {
      const rejected = rejectIfUnknownField(body.company_name, "company_name");
      if (rejected) return rejected;
      companyUpdates.name = String(body.company_name).trim();
    }
    if (body.company_location !== undefined) {
      companyUpdates.location = nullIfUnknown(String(body.company_location));
    }
    if (body.company_industry !== undefined) {
      companyUpdates.industry = nullIfUnknown(String(body.company_industry));
    }
    if (body.company_website !== undefined) {
      companyUpdates.website = nullIfUnknown(String(body.company_website));
    }

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
    if (body.title !== undefined) {
      const rejected = rejectIfUnknownField(body.title, "title");
      if (rejected) return rejected;
      jobUpdates.title = String(body.title).trim();
    }
    if (body.description !== undefined) jobUpdates.description = body.description;
    if (body.job_location !== undefined) {
      const rejected = rejectIfUnknownField(body.job_location, "job_location");
      if (rejected) return rejected;
      jobUpdates.job_location = String(body.job_location).trim();
    }
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
  const title = String(body.title ?? "").trim();
  const company_name = String(body.company_name ?? "").trim();
  const job_location = String(body.job_location ?? "").trim();

  if (!title || !company_name || !job_location) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: title, company_name, job_location" },
      { status: 400 },
    );
  }

  if (
    !canPersistJobPosting({
      company_name,
      title,
      job_location,
      requirements: body.requirements as string[] | undefined,
    })
  ) {
    return lowQualityResponse();
  }

  const { data: company, error: companyError } = await supabase!
    .from("company")
    .insert({
      name: company_name,
      location: nullIfUnknown(String(body.company_location ?? "")),
      industry: nullIfUnknown(String(body.company_industry ?? "")),
      website: nullIfUnknown(String(body.company_website ?? "")),
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
