"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ProgressBar } from "@/components/resume/ProgressBar";
import { SaveStatusBar, type SaveStatus } from "@/components/resume/SaveStatusBar";
import { useResumeStore, useJobPostingStore } from "@/stores";
import { useProfile } from "@/hooks/useProfile";
import { useResume, useJobPosting, RESUMES_QUERY_KEY } from "@/hooks/useDocuments";
import { RESUME_VERSIONS_QUERY_KEY } from "@/hooks/useResumeVersions";
import { generateLatexFromData } from "@/lib/latex-generator";
import ContentBuilderForm from "@/components/form/content-builder-form";
import JobAnalysisForm from "@/components/form/job-description-form";
import type { ResumeDataResponse, JobPostingResponse } from "@/lib/api-services";
import type { JobPosting } from "@/types/job-posting";
import { toast } from "sonner";

interface ResumeContentProps {
  resumeId?: string | null;
  initialResume?: ResumeDataResponse | null;
  initialJobPosting?: JobPostingResponse | null;
}

export function ResumeContent({
  resumeId: initialResumeId,
  initialResume,
  initialJobPosting,
}: ResumeContentProps) {
  const router = useRouter();
  const {
    resumeTitle,
    jobId,
    resumeData,
    currentStep,
    setResumeId,
    setResumeData,
    setCurrentStep,
    setJobId,
    setResumeTitle,
    isDirty: isResumeDirty,
  } = useResumeStore();
  const {
    jobPosting,
    selectedKeywords,
    jobDescription,
    isDirty: isJobPostingDirty,
  } = useJobPostingStore();

  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const profileRef = useRef(profileData);
  useEffect(() => { profileRef.current = profileData; }, [profileData]);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSavedAtRef = useRef<Date | null>(null);

  const { data: resumeApiData } = useResume(initialResumeId ?? null, initialResume ?? undefined);
  const { data: jobPostingApiData } = useJobPosting(resumeApiData?.job_id ?? null, initialJobPosting ?? undefined);

  useEffect(() => {
    lastSavedAtRef.current = lastSavedAt;
  }, [lastSavedAt]);

  useEffect(() => {
    if (!resumeApiData?.last_updated) return;
    if (isResumeDirty || isJobPostingDirty) return;

    const savedAt = new Date(resumeApiData.last_updated);
    setLastSavedAt(savedAt);
    setSaveStatus("saved");
  }, [resumeApiData?.last_updated, isResumeDirty, isJobPostingDirty]);

  // Sync resume data into Zustand store when the query resolves.
  // Guard with a ref so background React Query refetches don't overwrite pending user edits.
  const syncedResumeIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!resumeApiData || !initialResumeId) return;
    if (syncedResumeIdRef.current === initialResumeId) return;
    syncedResumeIdRef.current = initialResumeId;

    const profile = profileData ?? profileRef.current;
    const profileName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
    setResumeId(initialResumeId);
    setJobId(resumeApiData.job_id);
    setResumeTitle(resumeApiData.title, false);
    setResumeData(
      (prev) => ({
        personalInfo: {
          ...prev.personalInfo,
          ...(profileName ? { name: profileName } : {}),
          email: profile?.email || prev.personalInfo.email,
          phone: profile?.phone || prev.personalInfo.phone,
          linkedin: profile?.linkedin || prev.personalInfo.linkedin,
          github: profile?.github || prev.personalInfo.github,
          address: profile?.location || prev.personalInfo.address,
        },
        education: resumeApiData.sections?.education || [],
        experience: resumeApiData.sections?.work_experience || [],
        projects: resumeApiData.sections?.projects || [],
        leadership: resumeApiData.sections?.leadership || [],
        technicalSkills: resumeApiData.sections?.skills || {
          languages: "",
          developerTools: "",
          technologiesFrameworks: "",
        },
      }),
      false,
    );
  }, [resumeApiData, initialResumeId, profileData, setResumeId, setJobId, setResumeTitle, setResumeData]);

  // Sync job posting into Zustand store when that query resolves (may already be prefetched).
  const syncedJobIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!jobPostingApiData || !resumeApiData?.job_id) return;
    if (syncedJobIdRef.current === resumeApiData.job_id) return;
    syncedJobIdRef.current = resumeApiData.job_id;

    const allRequirements = [
      ...new Set([
        ...(jobPostingApiData.requirements || []),
        ...(jobPostingApiData.selected_requirements || []),
      ]),
    ];
    const jobPostingForStore: JobPosting = {
      title: jobPostingApiData.title || "",
      job_location: jobPostingApiData.job_location || "",
      company_name: jobPostingApiData.company?.name || "",
      company_location: jobPostingApiData.company?.location,
      company_industry: jobPostingApiData.company?.industry,
      company_website: jobPostingApiData.company?.website,
      description: jobPostingApiData.description,
      posted_date: jobPostingApiData.posted_date,
      close_date: jobPostingApiData.close_date,
      requirements: allRequirements,
      selected_requirements: jobPostingApiData.selected_requirements,
    };
    useJobPostingStore.getState().setJobPosting(jobPostingForStore, false);
    useJobPostingStore.getState().setSelectedKeywords(jobPostingApiData.selected_requirements || [], false);
    useJobPostingStore.getState().setJobDescription(jobPostingApiData.description || "", false);
  }, [jobPostingApiData, resumeApiData?.job_id]);

  // Merge account profile into personalInfo whenever profile loads (including
  // existing resumes — the resume sync effect may run before profile is ready).
  useEffect(() => {
    if (!profileData) return;
    const name = `${profileData.first_name ?? ""} ${profileData.last_name ?? ""}`.trim();
    setResumeData(
      (prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          ...(name ? { name } : {}),
          email: profileData.email || prev.personalInfo.email,
          phone: profileData.phone || prev.personalInfo.phone,
          linkedin: profileData.linkedin || prev.personalInfo.linkedin,
          github: profileData.github || prev.personalInfo.github,
          address: profileData.location || prev.personalInfo.address,
        },
      }),
      false,
    );
  }, [profileData, setResumeData]);

  const saveJobPostingNow = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const saveJobPostingResponse = await useJobPostingStore
        .getState()
        .saveJobPosting();
      if (saveJobPostingResponse) {
        const savedAt = new Date();
        setLastSavedAt(savedAt);
        setSaveStatus("saved");
        return;
      }
      setSaveStatus(lastSavedAtRef.current ? "saved" : "idle");
    } catch {
      console.error("Auto-save job posting failed");
      setSaveStatus("error");
    }
  }, []);

  const saveResumeNow = useCallback(async (
    versionSource: "manual" | "autosave" = "autosave",
    versionLabel?: string,
  ) => {
    const currentResumeId = useResumeStore.getState().resumeId;
    setSaveStatus("saving");

    try {
      const saveResumeResponse = await useResumeStore.getState().saveResume({
        force: versionSource === "manual",
        versionSource,
        versionLabel,
      });
      if (saveResumeResponse) {
        const savedAt = new Date();
        setLastSavedAt(savedAt);
        setSaveStatus("saved");
        queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY });
        if (currentResumeId) {
          queryClient.invalidateQueries({
            queryKey: RESUME_VERSIONS_QUERY_KEY(currentResumeId),
          });
        }

        if (versionSource === "manual") {
          if (saveResumeResponse.version_error) {
            toast.error(
              `Resume saved, but version failed: ${saveResumeResponse.version_error}`,
            );
          } else if (saveResumeResponse.version_created) {
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
  }, [queryClient]);

  const [isManualSaving, setIsManualSaving] = useState(false);

  const debouncedSaveJobPosting = useDebouncedCallback(saveJobPostingNow, 2000);
  const debouncedSaveResume = useDebouncedCallback(saveResumeNow, 2000);

  const manualSaveResume = useCallback(async (versionLabel?: string) => {
    debouncedSaveResume.cancel();
    setIsManualSaving(true);
    try {
      await saveResumeNow("manual", versionLabel);
    } finally {
      setIsManualSaving(false);
    }
  }, [debouncedSaveResume, saveResumeNow]);

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

  // Trigger auto-save when data changes (only if jobPosting exists and user has made modifications)
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

  // Trigger auto-save for resume (only if jobId exists and user has made modifications)
  // The saveResume function checks isDirty and isSaving to prevent duplicate saves
  useEffect(() => {
    if (isResumeDirty && jobId) {
      debouncedSaveResume();
    }
  }, [resumeData, resumeTitle, jobId, isResumeDirty, debouncedSaveResume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSaveResume.flush(); // Save any pending changes immediately
      debouncedSaveJobPosting.flush(); // Save any pending changes immediately
      useResumeStore.getState().resetStore();
      useJobPostingStore.getState().resetStore();
      // Reset sync guards so the next mount (or StrictMode re-mount) re-syncs fresh data
      syncedResumeIdRef.current = null;
      syncedJobIdRef.current = null;
    };
  }, [debouncedSaveResume, debouncedSaveJobPosting]);

  const steps = [
    {
      label: "Job Description Analysis",
      backButton: {
        label: "Cancel",
      },
      nextButton: {
        label: "Next",
        isDisabled: jobDescription.trim() === "" || resumeTitle.trim() === "",
      },
    },
    {
      label: "Content Builder",
      backButton: {
        label: "Back",
      },
      nextButton: {
        label: "Export",
      },
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

    setCurrentStep(currentStep + 1);
  };

  /**
   * Download PDF
   */
  async function downloadPdf() {
    // Use store setters so layout and content builder share state
    const setIsPdfGenerating = useResumeStore.getState().setIsPdfGenerating;
    const setCompileError = useResumeStore.getState().setCompileError;
    const latex = useResumeStore.getState().latex;
    const mode = useResumeStore.getState().mode;
    const resumeData = useResumeStore.getState().resumeData;

    setIsPdfGenerating(true);
    setCompileError(null);

    try {
      const latexContent =
        mode === "latex"
          ? latex
          : generateLatexFromData(
              resumeData as unknown as import("@/types/resume").ResumeData,
            );

      const response = await fetch("/api/compile-latex", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex: latexContent }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503) {
          const message =
            errorData.message ||
            "The LaTeX service is busy. Please try again in a moment.";
          toast.warning(message);
          setCompileError(message, "busy");
          return;
        }
        if (response.status === 502 || response.status >= 500) {
          const message =
            errorData.message ||
            errorData.error ||
            "LaTeX service is unavailable";
          toast.warning("Please Contact Support to Activate PDF Preview");
          setCompileError(message, "unavailable");
          return;
        }
        setCompileError(
          errorData.message || errorData.error || "Failed to download PDF",
          "other",
        );
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const error = err as Error;
      console.error("PDF download failed:", error);
      setCompileError(error.message || "Failed to download PDF");
    } finally {
      setIsPdfGenerating(false);
    }
  }

  return (
    <>
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
      {currentStep === 1 && <JobAnalysisForm />}
      {currentStep === 2 && (
        <ContentBuilderForm
          onManualSave={manualSaveResume}
          isManualSaving={isManualSaving}
        />
      )}
    </>
  );
}
