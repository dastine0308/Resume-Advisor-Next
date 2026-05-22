import { useMutation, useQueryClient } from "@tanstack/react-query";
import { JOB_POSTING_QUERY_KEY } from "@/hooks/useDocuments";
import {
  jobPostingResponseFromDraft,
  saveJobPostingDraft,
  type JobPostingDraft,
  type SaveJobPostingResult,
} from "@/lib/job-posting-draft";
import type { JobPostingResponse } from "@/lib/api-services";

type SaveJobPostingInput = {
  jobId: string | null | undefined;
  draft: JobPostingDraft;
  onJobIdCreated?: (jobId: string) => void;
};

export function useSaveJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, draft }: SaveJobPostingInput) =>
      saveJobPostingDraft(jobId, draft),
    onSuccess: (
      result: SaveJobPostingResult,
      { onJobIdCreated }: SaveJobPostingInput,
    ) => {
      if (result.status !== "saved") return;

      const savedJobId = result.response.job_id;
      queryClient.setQueryData<JobPostingResponse>(
        JOB_POSTING_QUERY_KEY(savedJobId),
        (old) =>
          jobPostingResponseFromDraft(savedJobId, result.draft, old ?? undefined),
      );

      onJobIdCreated?.(savedJobId);
    },
  });
}
