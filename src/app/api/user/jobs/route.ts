import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";

type JobPostingEmbed = {
  id: string;
  title: string;
  job_location: string | null;
  posted_date: string | null;
  close_date: string | null;
  company: { name: string } | { name: string }[] | null;
};

type ResumeJobRow = {
  job_id: string | null;
  last_updated: string | null;
  job_postings: JobPostingEmbed | JobPostingEmbed[] | null;
};

function resolveJobPosting(
  embed: ResumeJobRow["job_postings"]
): JobPostingEmbed | null {
  if (!embed) return null;
  return Array.isArray(embed) ? (embed[0] ?? null) : embed;
}

function resolveCompanyName(
  company: JobPostingEmbed["company"]
): string | undefined {
  if (!company) return undefined;
  if (Array.isArray(company)) return company[0]?.name;
  return company.name;
}

export async function GET() {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  // Join resumes → job_postings → company to get the jobs the user has resumes for
  const { data, error: dbError } = await supabase!
    .from("resumes")
    .select(`
      job_id,
      last_updated,
      job_postings (
        id,
        title,
        job_location,
        posted_date,
        close_date,
        company ( name )
      )
    `)
    .eq("user_id", user!.id)
    .order("last_updated", { ascending: false });

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  const jobs = ((data ?? []) as unknown as ResumeJobRow[]).map((r) => {
    const posting = resolveJobPosting(r.job_postings);
    return {
      id: posting?.id,
      title: posting?.title,
      company: resolveCompanyName(posting?.company ?? null),
      location: posting?.job_location,
      posted_date: posting?.posted_date,
      close_date: posting?.close_date,
    };
  });

  return NextResponse.json({ success: true, data: jobs, count: jobs.length });
}
