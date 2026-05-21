import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUserResumes,
  getUserCoverLetters,
  deleteResume,
  deleteCoverLetter,
  getResumeById,
  getJobPosting,
  type ResumesResponse,
  type ResumeDataResponse,
  type JobPostingResponse,
} from "@/lib/api-services";
import type { CoverLetterListItem } from "@/types/cover-letter";

export const RESUMES_QUERY_KEY = ["resumes"] as const;
export const COVER_LETTERS_QUERY_KEY = ["cover-letters"] as const;
export const RESUME_QUERY_KEY = (id: string) => ["resume", id] as const;
export const JOB_POSTING_QUERY_KEY = (id: string) => ["job-posting", id] as const;

export function useResumes() {
  return useQuery({
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
    initialData: initialData ?? undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
  });
}

export function useCoverLetters() {
  return useQuery({
    queryKey: COVER_LETTERS_QUERY_KEY,
    queryFn: getUserCoverLetters,
  });
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
      const previous = queryClient.getQueryData<CoverLetterListItem[]>(COVER_LETTERS_QUERY_KEY);
      queryClient.setQueryData<CoverLetterListItem[]>(COVER_LETTERS_QUERY_KEY, (old) =>
        old?.filter((cl) => cl.id !== id) ?? []
      );
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
