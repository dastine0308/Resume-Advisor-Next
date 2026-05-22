import type { JobPostingResponse } from "@/lib/api-services";
import { createOrUpdateJobPosting } from "@/lib/api-services";
import {
  canPersistJobPosting,
  nullIfUnknown,
  type SkippedJobPostingSaveReason,
} from "@/lib/job-analysis-quality";
import type { JobPosting } from "@/types/job-posting";

export type JobPostingDraft = {
  jobPosting: JobPosting | null;
  jobDescription: string;
  selectedKeywords: string[];
};

export type SaveJobPostingEvaluation =
  | { status: "ready" }
  | { status: "skipped"; reason: SkippedJobPostingSaveReason };

export type SaveJobPostingResult =
  | { status: "saved"; response: { job_id: string }; draft: JobPostingDraft }
  | { status: "skipped"; reason: SkippedJobPostingSaveReason };

export function emptyJobPostingDraft(): JobPostingDraft {
  return {
    jobPosting: null,
    jobDescription: "",
    selectedKeywords: [],
  };
}

export function mergeAllRequirements(
  requirements: string[] | undefined,
  selectedKeywords: string[] | undefined,
): string[] {
  return [...new Set([...(requirements ?? []), ...(selectedKeywords ?? [])])];
}

/** Fingerprint of API job data — remount draft when server selection changes. */
export function jobPostingSyncKey(
  jobId: string,
  jobPosting: Pick<
    JobPostingResponse,
    "description" | "requirements" | "selected_requirements"
  >,
): string {
  const sorted = (values: string[] | undefined) =>
    [...(values ?? [])].sort().join("\0");
  return `${jobId}:${jobPosting.description ?? ""}:${sorted(jobPosting.requirements)}:${sorted(jobPosting.selected_requirements)}`;
}

export function buildJobPostingDraftFromApi(
  api: JobPostingResponse,
): JobPostingDraft {
  const selectedKeywords = [...(api.selected_requirements ?? [])];
  return {
    jobPosting: {
      title: api.title ?? "",
      job_location: api.job_location ?? "",
      company_name: api.company?.name ?? "",
      company_location: api.company?.location,
      company_industry: api.company?.industry,
      company_website: api.company?.website,
      description: api.description,
      posted_date: api.posted_date,
      close_date: api.close_date,
      requirements: mergeAllRequirements(api.requirements, selectedKeywords),
      selected_requirements: selectedKeywords,
    },
    selectedKeywords,
    jobDescription: api.description ?? "",
  };
}

export function buildJobPostingDraftFromAnalysis(
  current: JobPostingDraft,
  analyzed: JobPosting,
): JobPostingDraft {
  return {
    jobDescription: current.jobDescription,
    selectedKeywords: [],
    jobPosting: {
      ...analyzed,
      requirements: analyzed.requirements ?? [],
      selected_requirements: [],
    },
  };
}

export function evaluateJobPostingSave(
  draft: JobPostingDraft,
): SaveJobPostingEvaluation {
  if (!draft.jobPosting) {
    return { status: "skipped", reason: "no_job_posting" };
  }

  const title = draft.jobPosting.title.trim();
  const company_name = draft.jobPosting.company_name.trim();
  const job_location = draft.jobPosting.job_location.trim();

  if (
    !canPersistJobPosting({
      company_name,
      title,
      job_location,
      requirements: draft.jobPosting.requirements,
    })
  ) {
    return { status: "skipped", reason: "low_quality" };
  }

  return { status: "ready" };
}

export function buildJobPostingSavePayload(
  jobId: string | null | undefined,
  draft: JobPostingDraft,
) {
  const { jobPosting, selectedKeywords, jobDescription } = draft;
  if (!jobPosting) {
    throw new Error("Cannot build save payload without job posting");
  }

  const title = jobPosting.title.trim();
  const company_name = jobPosting.company_name.trim();
  const job_location = jobPosting.job_location.trim();

  return {
    job_id: jobId || undefined,
    title,
    company_name,
    job_location,
    close_date: jobPosting.close_date || new Date().toISOString().split("T")[0],
    company_industry: nullIfUnknown(jobPosting.company_industry) ?? undefined,
    company_location: nullIfUnknown(jobPosting.company_location) ?? undefined,
    company_website: nullIfUnknown(jobPosting.company_website) ?? undefined,
    description: jobDescription,
    posted_date: jobPosting.posted_date || new Date().toISOString().split("T")[0],
    requirements: jobPosting.requirements,
    selected_requirements: selectedKeywords,
  };
}

export function jobPostingResponseFromDraft(
  jobId: string,
  draft: JobPostingDraft,
  existing?: JobPostingResponse | null,
): JobPostingResponse {
  if (!draft.jobPosting) {
    throw new Error("Cannot build query response without job posting");
  }

  const allReqs = draft.jobPosting.requirements ?? [];
  const selectedSet = new Set(draft.selectedKeywords);

  return {
    id: jobId,
    title: draft.jobPosting.title,
    description: draft.jobDescription,
    job_location: draft.jobPosting.job_location,
    posted_date: draft.jobPosting.posted_date,
    close_date: draft.jobPosting.close_date,
    company: existing?.company ?? {
      id: "",
      name: draft.jobPosting.company_name,
      location: draft.jobPosting.company_location,
      industry: draft.jobPosting.company_industry,
      website: draft.jobPosting.company_website,
    },
    requirements: allReqs.filter((r) => !selectedSet.has(r)),
    selected_requirements: [...draft.selectedKeywords],
  };
}

let saveJobPostingInFlight: Promise<SaveJobPostingResult> | null = null;

/** Persist draft to API; dedupes concurrent saves. */
export async function saveJobPostingDraft(
  jobId: string | null | undefined,
  draft: JobPostingDraft,
): Promise<SaveJobPostingResult> {
  if (saveJobPostingInFlight) {
    return saveJobPostingInFlight;
  }

  saveJobPostingInFlight = (async (): Promise<SaveJobPostingResult> => {
    const evaluation = evaluateJobPostingSave(draft);
    if (evaluation.status === "skipped") {
      return evaluation;
    }

    const response = await createOrUpdateJobPosting(
      buildJobPostingSavePayload(jobId, draft),
    );
    return {
      status: "saved",
      response: { job_id: String(response.job_id) },
      draft,
    };
  })();

  try {
    return await saveJobPostingInFlight;
  } finally {
    saveJobPostingInFlight = null;
  }
}
