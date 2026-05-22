"use client";

import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import type { ResumeDraft } from "@/lib/resume-draft";
import type { ResumeData } from "@/types/resume";

type ResumeDraftContextValue = {
  draft: ResumeDraft;
  setDraft: (updater: (prev: ResumeDraft) => ResumeDraft) => void;
  replaceDraft: (next: ResumeDraft, markDirty?: boolean) => void;
  isDirty: boolean;
  markSaved: () => void;
};

const ResumeDraftContext = createContext<ResumeDraftContextValue | null>(null);

export function ResumeDraftProvider({
  value,
  children,
}: {
  value: ResumeDraftContextValue;
  children: ReactNode;
}) {
  return (
    <ResumeDraftContext.Provider value={value}>
      {children}
    </ResumeDraftContext.Provider>
  );
}

export function useResumeDraftContext() {
  const context = useContext(ResumeDraftContext);
  if (!context) {
    throw new Error("useResumeDraftContext must be used within ResumeDraftProvider");
  }
  return context;
}

export function useEducation() {
  return useResumeDraftContext().draft.resumeData.education;
}

export function useExperience() {
  return useResumeDraftContext().draft.resumeData.experience;
}

export function useProjects() {
  return useResumeDraftContext().draft.resumeData.projects;
}

export function useLeadership() {
  return useResumeDraftContext().draft.resumeData.leadership;
}

export function useSetResumeData() {
  const { setDraft, replaceDraft, draft } = useResumeDraftContext();

  return useCallback(
    (
      updater: ResumeData | ((prev: ResumeData) => ResumeData),
      markDirty = true,
    ) => {
      const apply = (prev: ResumeDraft): ResumeDraft => ({
        ...prev,
        resumeData:
          typeof updater === "function"
            ? (updater as (p: ResumeData) => ResumeData)(prev.resumeData)
            : updater,
      });

      if (markDirty) {
        setDraft(apply);
        return;
      }

      replaceDraft(apply(draft), false);
    },
    [draft, replaceDraft, setDraft],
  );
}
