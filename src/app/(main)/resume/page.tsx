import { Suspense } from "react";
import { ResumeContent } from "@/components/resume-content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ResumeDataResponse, JobPostingResponse } from "@/lib/api-services";

interface ResumePageProps {
  searchParams: Promise<{ resumeId?: string | null }>;
}

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const params = await searchParams;
  const resumeId = params?.resumeId ?? null;

  let initialResume: ResumeDataResponse | null = null;
  let initialJobPosting: JobPostingResponse | null = null;

  if (resumeId) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: resumeRaw } = await supabase
          .from("resumes")
          .select("id, job_id, title, content, creation_date, last_updated")
          .eq("id", resumeId)
          .eq("user_id", user.id)
          .single();

        if (resumeRaw) {
          initialResume = {
            id: resumeRaw.id,
            job_id: resumeRaw.job_id,
            title: resumeRaw.title,
            creation_date: resumeRaw.creation_date,
            last_updated: resumeRaw.last_updated,
            sections: resumeRaw.content,
          };

          const { data: jpRaw } = await supabase
            .from("job_postings")
            .select(`
              id, title, description, job_location, posted_date, close_date,
              company ( id, name, location, industry, website ),
              job_requirements ( requirement, is_selected )
            `)
            .eq("id", resumeRaw.job_id)
            .eq("user_id", user.id)
            .single();

          if (jpRaw) {
            const allReqs = (jpRaw.job_requirements ?? []) as { requirement: string; is_selected: boolean }[];
            const companyRaw = Array.isArray(jpRaw.company) ? jpRaw.company[0] : jpRaw.company;
            initialJobPosting = {
              id: String(jpRaw.id),
              title: jpRaw.title ?? "",
              description: jpRaw.description ?? undefined,
              job_location: jpRaw.job_location ?? "",
              posted_date: jpRaw.posted_date ?? undefined,
              close_date: jpRaw.close_date ?? undefined,
              company: companyRaw as JobPostingResponse["company"],
              requirements: allReqs.filter((r) => !r.is_selected).map((r) => r.requirement),
              selected_requirements: allReqs.filter((r) => r.is_selected).map((r) => r.requirement),
            };
          }
        }
      }
    } catch {
      // SSR fetch failed — client will fall back to its own fetch
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResumeContent
        resumeId={resumeId}
        initialResume={initialResume}
        initialJobPosting={initialJobPosting}
      />
    </Suspense>
  );
}
