import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getResumeVersions,
  restoreResumeVersion,
  type ResumeVersionListItem,
} from "@/lib/api-services";
import { RESUME_QUERY_KEY } from "./useDocuments";

export const RESUME_VERSIONS_QUERY_KEY = (resumeId: string) =>
  ["resume-versions", resumeId] as const;

export function useResumeVersions(resumeId: string | null) {
  return useQuery({
    queryKey: RESUME_VERSIONS_QUERY_KEY(resumeId!),
    queryFn: () => getResumeVersions(resumeId!),
    enabled: !!resumeId,
    staleTime: 30_000,
  });
}

export function useRestoreResumeVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resumeId,
      versionId,
    }: {
      resumeId: string;
      versionId: string;
    }) => restoreResumeVersion(resumeId, versionId),
    onSuccess: (_data, { resumeId }) => {
      queryClient.invalidateQueries({ queryKey: RESUME_VERSIONS_QUERY_KEY(resumeId) });
      queryClient.invalidateQueries({ queryKey: RESUME_QUERY_KEY(resumeId) });
    },
  });
}

export type { ResumeVersionListItem };
