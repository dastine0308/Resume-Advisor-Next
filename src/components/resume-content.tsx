"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/resume/ProgressBar";
import { SaveStatusBar, type SaveStatus } from "@/components/resume/SaveStatusBar";
import { useResumeUIStore } from "@/stores";
import { useProfile } from "@/hooks/useProfile";
import { useJobPostingDraft } from "@/hooks/useJobPostingDraft";
import { useResumeDraft } from "@/hooks/useResumeDraft";
import { useSaveJobPosting } from "@/hooks/useJobPostingSave";
import { useSaveResume } from "@/hooks/useSaveResume";
import { useJobPosting, type ResumeLoadResult } from "@/hooks/useDocuments";
import { ResumeDraftProvider } from "@/contexts/ResumeDraftContext";
import { generateLatexFromData } from "@/lib/latex-generator";
import {
  downloadLaTeXAsPDF,
  LaTeXServiceBusyError,
  LaTeXServiceUnavailableError,
} from "@/lib/latex-client";
import {
  getJobPostingSaveFailureMessage,
  getStep1AdvanceBlockReason,
  type SkippedJobPostingSaveReason,
} from "@/lib/job-analysis-quality";
import ContentBuilderForm from "@/components/form/content-builder-form";
import JobAnalysisForm from "@/components/form/job-description-form";
import { toast } from "sonner";
import { LATEX_PREVIEW_UNAVAILABLE_MESSAGE } from "@/lib/latex-preview-feedback";
import {
  emptyJobPostingDraft,
  type JobPostingDraft,
} from "@/lib/job-posting-draft";
import { emptyResumeDraft, type ResumeDraft } from "@/lib/resume-draft";
import { showWarningToast } from "@/lib/toast-helpers";

function warnSkippedJobPostingSave(
  reason: SkippedJobPostingSaveReason,
  options?: { warnOnceRef?: React.MutableRefObject<boolean> },
) {
  if (reason === "low_quality" && options?.warnOnceRef?.current) return;
  if (reason === "low_quality" && options?.warnOnceRef) {
    options.warnOnceRef.current = true;
  }
  showWarningToast(
    "Job posting not saved",
    getJobPostingSaveFailureMessage(reason),
  );
}

type EditableResumeLoad = Extract<
  ResumeLoadResult,
  { kind: "new" } | { kind: "found" }
>;

interface ResumeContentProps {
  routeResumeId: string | null;
  resumeLoad: EditableResumeLoad;
  onFirstPersist?: (resumeId: string) => void;
}

export function ResumeContent({
  routeResumeId,
  resumeLoad,
  onFirstPersist,
}: ResumeContentProps) {
  const router = useRouter();
  const { currentStep, setCurrentStep, resetUI } = useResumeUIStore();
  const { data: profileData } = useProfile();

  const saveJobPostingMutation = useSaveJobPosting();
  const saveResumeMutation = useSaveResume();

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSavedAtRef = useRef<Date | null>(null);
  const lowQualityJobSaveWarnedRef = useRef(false);

  const resumeApiData =
    resumeLoad.kind === "found" ? resumeLoad.resume : undefined;
  const initialJobPosting =
    resumeLoad.kind === "found" ? resumeLoad.jobPosting ?? undefined : undefined;

  const { data: jobPostingApiData } = useJobPosting(
    resumeApiData?.job_id ?? null,
    initialJobPosting,
  );

  const resumeDraftState = useResumeDraft(resumeApiData, profileData);
  const {
    draft: resumeDraft,
    setDraft: setResumeDraft,
    replaceDraft: replaceResumeDraft,
    isDirty: isResumeDirty,
    markSaved: markResumeDraftSaved,
    resetDraftForNewResume,
  } = resumeDraftState;

  const {
    draft: jobDraft,
    setDraft: setJobDraft,
    isDirty: isJobPostingDirty,
    markSaved: markJobDraftSaved,
    resetDraftForNewResume: resetJobDraftForNewResume,
  } = useJobPostingDraft(jobPostingApiData);

  const resumeDraftRef = useRef<ResumeDraft>(emptyResumeDraft());
  resumeDraftRef.current = resumeDraft;

  const jobDraftRef = useRef<JobPostingDraft>(emptyJobPostingDraft());
  jobDraftRef.current = jobDraft;

  const { jobPosting, jobDescription, selectedKeywords } = jobDraft;
  const { title: resumeTitle, jobId, resumeData } = resumeDraft;

  const linkJobIdToResumeDraft = useCallback(
    (nextJobId: string) => {
      setResumeDraft((prev) => ({ ...prev, jobId: nextJobId }));
    },
    [setResumeDraft],
  );

  useEffect(() => {
    lastSavedAtRef.current = lastSavedAt;
  }, [lastSavedAt]);

  useEffect(() => {
    if (!resumeApiData?.last_updated) return;
    if (isResumeDirty || isJobPostingDirty) return;

    setLastSavedAt(new Date(resumeApiData.last_updated));
    setSaveStatus("saved");
  }, [resumeApiData?.last_updated, isResumeDirty, isJobPostingDirty]);

  useLayoutEffect(() => {
    if (!routeResumeId) {
      resetUI();
      resetDraftForNewResume();
      resetJobDraftForNewResume();
      return;
    }

    if (
      resumeDraft.resumeId != null &&
      String(resumeDraft.resumeId) !== String(routeResumeId)
    ) {
      resetUI();
      resetDraftForNewResume();
      resetJobDraftForNewResume();
    }
  }, [
    routeResumeId,
    resetDraftForNewResume,
    resetJobDraftForNewResume,
    resetUI,
    resumeDraft.resumeId,
  ]);

  const saveJobPostingNow = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const result = await saveJobPostingMutation.mutateAsync({
        jobId: resumeDraftRef.current.jobId,
        draft: jobDraftRef.current,
        onJobIdCreated: linkJobIdToResumeDraft,
      });

      if (result.status === "saved") {
        setLastSavedAt(new Date());
        setSaveStatus("saved");
        markJobDraftSaved();
        lowQualityJobSaveWarnedRef.current = false;
        return;
      }

      if (result.status === "skipped") {
        if (result.reason === "low_quality") {
          warnSkippedJobPostingSave(result.reason, {
            warnOnceRef: lowQualityJobSaveWarnedRef,
          });
          setSaveStatus("error");
        } else {
          setSaveStatus(lastSavedAtRef.current ? "saved" : "idle");
        }
        return;
      }

      setSaveStatus(lastSavedAtRef.current ? "saved" : "idle");
    } catch {
      console.error("Auto-save job posting failed");
      setSaveStatus("error");
    }
  }, [linkJobIdToResumeDraft, markJobDraftSaved, saveJobPostingMutation]);

  const saveResumeNow = useCallback(async (
    versionSource: "manual" | "autosave" = "autosave",
    versionLabel?: string,
  ) => {
    setSaveStatus("saving");

    try {
      const result = await saveResumeMutation.mutateAsync({
        draft: resumeDraftRef.current,
        options: {
          force: versionSource === "manual",
          isDirty: isResumeDirty || versionSource === "manual",
          versionSource,
          versionLabel,
        },
      });

      if (result.status === "saved") {
        replaceResumeDraft(result.draft, false);
        setLastSavedAt(new Date());
        setSaveStatus("saved");
        markResumeDraftSaved();

        if (!routeResumeId && result.draft.resumeId) {
          onFirstPersist?.(result.draft.resumeId);
          router.replace(
            `/resume?resumeId=${encodeURIComponent(result.draft.resumeId)}`,
            { scroll: false },
          );
        }

        if (versionSource === "manual") {
          if (result.response.version_error) {
            toast.error(
              `Resume saved, but version failed: ${result.response.version_error}`,
            );
          } else if (result.response.version_created) {
            toast.success("Version saved with change summary");
          } else {
            toast.success("Resume saved");
          }
        }

        return;
      }

      setSaveStatus(lastSavedAtRef.current ? "saved" : "idle");
    } catch {
      setSaveStatus("error");
    }
  }, [
    onFirstPersist,
    routeResumeId,
    isResumeDirty,
    markResumeDraftSaved,
    replaceResumeDraft,
    router,
    saveResumeMutation,
  ]);

  const [isManualSaving, setIsManualSaving] = useState(false);

  const debouncedSaveJobPosting = useDebouncedCallback(saveJobPostingNow, 2000);
  const debouncedSaveResume = useDebouncedCallback(saveResumeNow, 2000);
  const debouncedSaveJobPostingRef = useRef(debouncedSaveJobPosting);
  debouncedSaveJobPostingRef.current = debouncedSaveJobPosting;
  const debouncedSaveResumeRef = useRef(debouncedSaveResume);
  debouncedSaveResumeRef.current = debouncedSaveResume;

  const manualSaveResume = useCallback(async (versionLabel?: string) => {
    debouncedSaveResumeRef.current.cancel();
    setIsManualSaving(true);
    try {
      await saveResumeNow("manual", versionLabel);
    } finally {
      setIsManualSaving(false);
    }
  }, [saveResumeNow]);

  const handleRetrySave = useCallback(() => {
    if (currentStep === 1) {
      void saveJobPostingNow();
      return;
    }
    if (currentStep === 2) {
      void saveResumeNow();
    }
  }, [currentStep, saveJobPostingNow, saveResumeNow]);

  useEffect(() => {
    if (saveStatus === "saving") return;

    const hasPendingJobSave =
      currentStep === 1 &&
      isJobPostingDirty &&
      (jobPosting || jobDescription.trim() !== "");
    const hasPendingResumeSave = currentStep === 2 && isResumeDirty && !!jobId;

    if (hasPendingJobSave || hasPendingResumeSave) {
      setSaveStatus("unsaved");
    }
  }, [
    currentStep,
    isJobPostingDirty,
    isResumeDirty,
    jobId,
    jobPosting,
    jobDescription,
    saveStatus,
  ]);

  useEffect(() => {
    if (isJobPostingDirty && (jobPosting || jobDescription.trim() !== "")) {
      debouncedSaveJobPosting();
    }
  }, [
    jobPosting,
    resumeTitle,
    jobDescription,
    selectedKeywords,
    isJobPostingDirty,
    debouncedSaveJobPosting,
  ]);

  useEffect(() => {
    if (isResumeDirty && jobId) {
      debouncedSaveResume();
    }
  }, [resumeData, resumeTitle, jobId, isResumeDirty, debouncedSaveResume]);

  useEffect(() => {
    return () => {
      debouncedSaveResumeRef.current.flush();
      debouncedSaveJobPostingRef.current.flush();
    };
  }, []);

  const step1AdvanceBlockReason = useMemo(
    () =>
      getStep1AdvanceBlockReason({
        resumeTitle,
        jobDescription,
        jobPosting,
      }),
    [resumeTitle, jobDescription, jobPosting],
  );

  const steps = [
    {
      label: "Job Description Analysis",
      backButton: { label: "Cancel" },
      nextButton: {
        label: "Next",
        isDisabled: step1AdvanceBlockReason !== null,
      },
    },
    {
      label: "Content Builder",
      backButton: { label: "Back" },
      nextButton: { label: "Export" },
    },
  ];

  const handleBack = () => {
    if (currentStep === 1) {
      router.push("/dashboard");
      return;
    }
    setCurrentStep(currentStep - 1);
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      downloadPdf();
      return;
    }

    if (currentStep === 1 && step1AdvanceBlockReason) {
      showWarningToast("Complete job details first", step1AdvanceBlockReason);
      return;
    }

    if (currentStep === 1) {
      debouncedSaveJobPostingRef.current.cancel();

      if (!isJobPostingDirty && !saveJobPostingMutation.isPending) {
        setCurrentStep(currentStep + 1);
        return;
      }

      setSaveStatus("saving");
      try {
        const result = await saveJobPostingMutation.mutateAsync({
          jobId: resumeDraftRef.current.jobId,
          draft: jobDraftRef.current,
          onJobIdCreated: linkJobIdToResumeDraft,
        });
        if (result.status === "saved") {
          setLastSavedAt(new Date());
          setSaveStatus("saved");
          markJobDraftSaved();
          lowQualityJobSaveWarnedRef.current = false;
        } else if (result.status === "skipped") {
          warnSkippedJobPostingSave(result.reason);
          setSaveStatus(result.reason === "low_quality" ? "error" : "idle");
          return;
        }
      } catch {
        setSaveStatus("error");
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  async function downloadPdf() {
    const {
      setIsPdfGenerating,
      setCompileError,
      latex,
      mode,
    } = useResumeUIStore.getState();

    setIsPdfGenerating(true);
    setCompileError(null);

    try {
      const latexContent =
        mode === "latex"
          ? latex
          : generateLatexFromData(resumeDraftRef.current.resumeData);

      await downloadLaTeXAsPDF(latexContent, `resume-${Date.now()}.pdf`);
    } catch (err) {
      if (err instanceof LaTeXServiceBusyError) {
        toast.warning(err.message);
        setCompileError(err.message, "busy");
        return;
      }
      if (err instanceof LaTeXServiceUnavailableError) {
        toast.warning(LATEX_PREVIEW_UNAVAILABLE_MESSAGE);
        setCompileError(err.message, "unavailable");
        return;
      }
      const message =
        err instanceof Error ? err.message : "Failed to download PDF";
      console.error("PDF download failed:", err);
      setCompileError(message, "other");
    } finally {
      setIsPdfGenerating(false);
    }
  }

  const draftContextValue = useMemo(
    () => ({
      draft: resumeDraft,
      setDraft: setResumeDraft,
      replaceDraft: replaceResumeDraft,
      isDirty: isResumeDirty,
      markSaved: markResumeDraftSaved,
    }),
    [
      isResumeDirty,
      markResumeDraftSaved,
      replaceResumeDraft,
      resumeDraft,
      setResumeDraft,
    ],
  );

  return (
    <ResumeDraftProvider value={draftContextValue}>
      <div className="border-b border-gray-200">
        <ProgressBar
          currentStep={currentStep}
          totalSteps={steps.length}
          steps={steps}
          onBack={handleBack}
          onNext={handleNext}
        />
        <div className="px-4 pb-3 md:px-5">
          <SaveStatusBar
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            onRetry={saveStatus === "error" ? handleRetrySave : undefined}
          />
        </div>
      </div>
      {currentStep === 1 && (
        <JobAnalysisForm draft={jobDraft} onDraftChange={setJobDraft} />
      )}
      {currentStep === 2 && (
        <ContentBuilderForm
          onManualSave={manualSaveResume}
          isManualSaving={isManualSaving}
          selectedKeywords={selectedKeywords}
        />
      )}
    </ResumeDraftProvider>
  );
}
