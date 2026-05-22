import { useCallback, useEffect, useRef, useState } from "react";
import type { JobPostingResponse } from "@/lib/api-services";
import {
  buildJobPostingDraftFromApi,
  emptyJobPostingDraft,
  jobPostingSyncKey,
  type JobPostingDraft,
} from "@/lib/job-posting-draft";

export function useJobPostingDraft(
  apiData: JobPostingResponse | null | undefined,
) {
  const serverKey = apiData
    ? jobPostingSyncKey(String(apiData.id), apiData)
    : null;

  const [draft, setDraft] = useState<JobPostingDraft>(() =>
    apiData ? buildJobPostingDraftFromApi(apiData) : emptyJobPostingDraft(),
  );
  const [isDirty, setIsDirty] = useState(false);
  const lastServerKeyRef = useRef<string | null>(serverKey);

  useEffect(() => {
    if (!apiData || !serverKey) return;
    if (lastServerKeyRef.current === serverKey) return;
    lastServerKeyRef.current = serverKey;
    setDraft(buildJobPostingDraftFromApi(apiData));
    setIsDirty(false);
  }, [apiData, serverKey]);

  const resetDraftForNewResume = useCallback(() => {
    lastServerKeyRef.current = null;
    setDraft(emptyJobPostingDraft());
    setIsDirty(false);
  }, []);

  const updateDraft = useCallback(
    (updater: (prev: JobPostingDraft) => JobPostingDraft) => {
      setIsDirty(true);
      setDraft(updater);
    },
    [],
  );

  const markSaved = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    draft,
    setDraft: updateDraft,
    setDraftDirect: setDraft,
    isDirty,
    markSaved,
    resetDraftForNewResume,
  };
}
