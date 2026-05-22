import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  JOB_POSTING_QUERY_KEY,
  RESUME_LOAD_QUERY_KEY,
  RESUME_QUERY_KEY,
  RESUMES_QUERY_KEY,
} from "@/hooks/useDocuments";
import { RESUME_VERSIONS_QUERY_KEY } from "@/hooks/useResumeVersions";
import {
  resumeQueryDataFromDraft,
  saveResumeDraft,
  type ResumeDraft,
  type SaveResumeOptions,
  type SaveResumeResult,
} from "@/lib/resume-draft";
import type { ResumeLoadResult } from "@/lib/resume-load";
import type { JobPostingResponse, ResumeDataResponse, ResumesResponse } from "@/lib/api-services";

type SaveResumeInput = {
  draft: ResumeDraft;
  options: SaveResumeOptions;
};

export function useSaveResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ draft, options }: SaveResumeInput) =>
      saveResumeDraft(draft, options),
    onSuccess: (result: SaveResumeResult, { options }) => {
      if (result.status !== "saved") return;

      const savedId = result.draft.resumeId;
      if (!savedId) return;

      const savedAt = new Date();
      const resumeData = resumeQueryDataFromDraft(
        result.draft,
        queryClient.getQueryData<ResumeDataResponse>(RESUME_QUERY_KEY(savedId)),
        savedAt,
      );

      queryClient.setQueryData<ResumeDataResponse>(
        RESUME_QUERY_KEY(savedId),
        resumeData,
      );

      const jobPosting = result.draft.jobId
        ? queryClient.getQueryData<JobPostingResponse>(
            JOB_POSTING_QUERY_KEY(result.draft.jobId),
          ) ?? null
        : null;

      queryClient.setQueryData<ResumeLoadResult>(
        RESUME_LOAD_QUERY_KEY(savedId),
        { kind: "found", resume: resumeData, jobPosting },
      );

      queryClient.setQueryData<ResumesResponse[]>(RESUMES_QUERY_KEY, (old) => {
        if (!old) return old;
        const entry = {
          id: savedId,
          job_id: result.draft.jobId!,
          title: result.draft.title || "Untitled Resume",
          last_updated: savedAt.toISOString(),
        };
        const index = old.findIndex((resume) => String(resume.id) === savedId);
        if (index >= 0) {
          const next = [...old];
          next[index] = entry;
          return next;
        }
        return [entry, ...old];
      });

      if (options.versionSource === "manual") {
        queryClient.invalidateQueries({
          queryKey: RESUME_VERSIONS_QUERY_KEY(savedId),
        });
      }
    },
  });
}
