import { ApiRequestError } from "@/lib/api-client";
import {
  getJobPosting,
  getResumeById,
  type JobPostingResponse,
  type ResumeDataResponse,
} from "@/lib/api-services";

export type ResumeLoadResult =
  | { kind: "new" }
  | {
      kind: "found";
      resume: ResumeDataResponse;
      jobPosting: JobPostingResponse | null;
    }
  | { kind: "not_found"; id: string };

export async function loadResumeById(
  resumeId: string | null,
): Promise<ResumeLoadResult> {
  if (!resumeId) return { kind: "new" };

  try {
    const resume = await getResumeById(resumeId);

    let jobPosting: JobPostingResponse | null = null;
    if (resume.job_id) {
      try {
        jobPosting = await getJobPosting(resume.job_id);
      } catch {
        // Job posting missing — still allow editing the resume.
      }
    }

    return { kind: "found", resume, jobPosting };
  } catch (err) {
    if (
      err instanceof ApiRequestError &&
      (err.status === 404 || err.status === 403)
    ) {
      return { kind: "not_found", id: resumeId };
    }
    throw err;
  }
}
