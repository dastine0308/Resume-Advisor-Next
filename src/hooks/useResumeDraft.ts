import { useCallback, useEffect, useRef, useState } from "react";
import type { ResumeDataResponse } from "@/lib/api-services";
import {
  buildResumeDraftFromApi,
  emptyResumeDraft,
  mergeProfileIntoResumeDraft,
  resumeSyncKey,
  type ProfileForResumeDraft,
  type ResumeDraft,
} from "@/lib/resume-draft";

export function useResumeDraft(
  apiData: ResumeDataResponse | null | undefined,
  profile: ProfileForResumeDraft,
) {
  const serverKey = apiData
    ? resumeSyncKey(String(apiData.id), apiData.last_updated)
    : null;

  const [draft, setDraft] = useState<ResumeDraft>(() =>
    apiData ? buildResumeDraftFromApi(apiData, profile) : emptyResumeDraft(),
  );
  const [isDirty, setIsDirty] = useState(false);
  const lastServerKeyRef = useRef<string | null>(serverKey);

  useEffect(() => {
    if (!apiData || !serverKey) return;
    if (lastServerKeyRef.current === serverKey) return;
    lastServerKeyRef.current = serverKey;
    setDraft(buildResumeDraftFromApi(apiData, profile));
    setIsDirty(false);
  }, [apiData, profile, serverKey]);

  useEffect(() => {
    if (!profile) return;
    setDraft((prev) => mergeProfileIntoResumeDraft(prev, profile));
  }, [profile]);

  const resetDraftForNewResume = useCallback(() => {
    lastServerKeyRef.current = null;
    setDraft(emptyResumeDraft());
    setIsDirty(false);
  }, []);

  const updateDraft = useCallback(
    (updater: (prev: ResumeDraft) => ResumeDraft) => {
      setIsDirty(true);
      setDraft(updater);
    },
    [],
  );

  const replaceDraft = useCallback((next: ResumeDraft, markDirty = false) => {
    setDraft(next);
    setIsDirty(markDirty);
  }, []);

  const markSaved = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    draft,
    setDraft: updateDraft,
    replaceDraft,
    isDirty,
    markSaved,
    resetDraftForNewResume,
  };
}
