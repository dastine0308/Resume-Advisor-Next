import { useQuery, useSuspenseQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api-client";
import {
  getUserResumes,
  getUserCoverLetters,
  deleteResume,
  deleteCoverLetter,
  getResumeById,
  getJobPosting,
  getCoverLetterById,
  type ResumesResponse,
  type ResumeDataResponse,
  type JobPostingResponse,
} from "@/lib/api-services";
import { loadResumeById } from "@/lib/resume-load";
import type { CoverLetter, CoverLetterContent, CoverLetterListItem } from "@/types/cover-letter";

export type { ResumeLoadResult } from "@/lib/resume-load";

export const RESUMES_QUERY_KEY = ["resumes"] as const;
export const COVER_LETTERS_QUERY_KEY = ["cover-letters"] as const;
export const RESUME_QUERY_KEY = (id: string) => ["resume", id] as const;
export const RESUME_LOAD_QUERY_KEY = (id: string) => ["resume-load", id] as const;
export const JOB_POSTING_QUERY_KEY = (id: string) => ["job-posting", id] as const;

export function useSuspenseResume(resumeId: string | null) {
  return useSuspenseQuery({
    queryKey: RESUME_LOAD_QUERY_KEY(resumeId ?? "__new__"),
    queryFn: () => loadResumeById(resumeId),
  });
}

export function useSuspenseResumes() {
  return useSuspenseQuery({
    queryKey: RESUMES_QUERY_KEY,
    queryFn: getUserResumes,
  });
}

export function useResume(id: string | null, initialData?: ResumeDataResponse) {
  return useQuery({
    queryKey: RESUME_QUERY_KEY(id!),
    queryFn: () => getResumeById(id!),
    enabled: !!id,
    staleTime: 30_000,
    refetchOnMount: "always",
    initialData: initialData ?? undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useJobPosting(id: string | null, initialData?: JobPostingResponse) {
  return useQuery({
    queryKey: JOB_POSTING_QUERY_KEY(id!),
    queryFn: () => getJobPosting(id!),
    enabled: !!id,
    staleTime: 30_000,
    refetchOnMount: "always",
    initialData: initialData ?? undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useSuspenseCoverLetters() {
  return useSuspenseQuery({
    queryKey: COVER_LETTERS_QUERY_KEY,
    queryFn: getUserCoverLetters,
  });
}

export const COVER_LETTER_QUERY_KEY = (id: string) => ["cover-letter", id] as const;

export type CoverLetterLoadResult =
  | { kind: "new" }
  | { kind: "found"; coverLetter: CoverLetter }
  | { kind: "not_found"; id: string };

export function useSuspenseCoverLetter(id: string | null) {
  return useSuspenseQuery({
    queryKey: COVER_LETTER_QUERY_KEY(id ?? "__new__"),
    queryFn: async (): Promise<CoverLetterLoadResult> => {
      if (!id) return { kind: "new" };
      try {
        const coverLetter = await getCoverLetterById(id);
        return { kind: "found", coverLetter };
      } catch (err) {
        if (
          err instanceof ApiRequestError &&
          (err.status === 404 || err.status === 403)
        ) {
          return { kind: "not_found", id };
        }
        throw err;
      }
    },
  });
}

/** Patch list + detail caches after a local save (avoids refetch / re-sync churn). */
export function updateCoverLetterCachesAfterSave(
  queryClient: QueryClient,
  input: {
    coverLetterId: string;
    title: string;
    jobId: string;
    content: CoverLetterContent;
    savedAt: Date;
  },
) {
  const last_updated = input.savedAt.toISOString();

  queryClient.setQueryData<CoverLetterLoadResult>(
    COVER_LETTER_QUERY_KEY(input.coverLetterId),
    (old) => {
      const creation_date =
        old?.kind === "found"
          ? old.coverLetter.creation_date
          : last_updated;
      return {
        kind: "found",
        coverLetter: {
          id: input.coverLetterId,
          title: input.title,
          job_id: input.jobId,
          creation_date,
          last_updated,
          content: { ...input.content },
        },
      };
    },
  );

  queryClient.setQueryData<CoverLetterListItem[]>(
    COVER_LETTERS_QUERY_KEY,
    (old) => {
      if (!old) return old;
      const entry: CoverLetterListItem = {
        id: input.coverLetterId,
        title: input.title,
        job_id: input.jobId,
        last_updated,
      };
      const index = old.findIndex(
        (cl) => String(cl.id) === String(input.coverLetterId),
      );
      if (index >= 0) {
        const next = [...old];
        next[index] = entry;
        return next;
      }
      return [entry, ...old];
    },
  );
}

export function useDeleteResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteResume(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: RESUMES_QUERY_KEY });
      const previous = queryClient.getQueryData<ResumesResponse[]>(RESUMES_QUERY_KEY);
      queryClient.setQueryData<ResumesResponse[]>(RESUMES_QUERY_KEY, (old) =>
        old?.filter((r) => r.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(RESUMES_QUERY_KEY, context?.previous);
      toast.error("Failed to delete resume");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COVER_LETTERS_QUERY_KEY });
    },
  });
}

export function useDeleteCoverLetter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCoverLetter(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: COVER_LETTERS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: COVER_LETTER_QUERY_KEY(id) });
      const previous = queryClient.getQueryData<CoverLetterListItem[]>(COVER_LETTERS_QUERY_KEY);
      queryClient.setQueryData<CoverLetterListItem[]>(COVER_LETTERS_QUERY_KEY, (old) =>
        old?.filter((cl) => cl.id !== id) ?? []
      );
      queryClient.removeQueries({ queryKey: COVER_LETTER_QUERY_KEY(id) });
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(COVER_LETTERS_QUERY_KEY, context?.previous);
      toast.error("Failed to delete cover letter");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COVER_LETTERS_QUERY_KEY });
    },
  });
}
