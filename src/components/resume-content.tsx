"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/resume/ProgressBar";
import { useResumeStore, useJobPostingStore } from "@/stores";
import { generateLatexFromData } from "@/lib/latex-generator";
import ContentBuilderForm from "@/components/form/content-builder-form";
import JobAnalysisForm from "@/components/form/job-description-form";
import { getJobPosting, getResumeById } from "@/lib/api-services";
import { toast } from "sonner";

interface ResumeContentProps {
  resumeId?: string | null;
}

export function ResumeContent({
  resumeId: initialResumeId,
}: ResumeContentProps) {
  const router = useRouter();
  const [, setIsLoading] = useState(!!initialResumeId);
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
  const { jobPosting, selectedKeywords, jobDescription, isDirty: isJobPostingDirty } = useJobPostingStore();

  const fetchResumeData = useCallback(async () => {
    if (initialResumeId) {
      setIsLoading(true);

      const response = await getResumeById(initialResumeId);
      if (response?.job_id) {
        setJobId(response.job_id);
        setResumeTitle(response.title, false);
        // Use functional update to access current state without adding resumeData as dependency
        const currentResumeData = useResumeStore.getState().resumeData;
        setResumeData({
          personalInfo: currentResumeData?.personalInfo || {},
          education: response?.sections?.education || [],
          experience: response?.sections?.work_experience || [],
          projects: response?.sections?.projects || [],
          leadership: response?.sections?.leadership || [],
          technicalSkills: response?.sections?.skills || {
            languages: "",
            developerTools: "",
            technologiesFrameworks: "",
          },
        }, false);

        const jobPosting = await getJobPosting(response.job_id.toString());
        useJobPostingStore.getState().setJobPosting(jobPosting, false);
        useJobPostingStore
          .getState()
          .setSelectedKeywords(jobPosting?.selected_requirements || [], false);
        useJobPostingStore
          .getState()
          .setJobDescription(jobPosting?.description || "", false);
      }
      setIsLoading(false);
    }
  }, [initialResumeId, setResumeData, setJobId, setResumeTitle]);

  useEffect(() => {
    if (initialResumeId) {
      // Editing existing resume
      setResumeId(initialResumeId);
      fetchResumeData();
    }
  }, [initialResumeId, setResumeId, fetchResumeData]);

  // Debounced auto-save: saves 2 seconds after user stops editing
  const debouncedSaveJobPosting = useDebouncedCallback(async () => {
    const toastId = "auto-save";

    toast.loading("Saving...", { id: toastId });
    try {
      const saveJobPostingResponse = await useJobPostingStore
        .getState()
        .saveJobPosting();
      if (saveJobPostingResponse) {
        toast.success("Saved", { id: toastId, duration: 1500 });
      }
    } catch {
      console.error("Auto-save job posting failed");
      toast.error("Failed to save", { id: toastId });
    }
  }, 2000);

  // Debounced auto-save: saves 2 seconds after user stops editing
  const debouncedSaveResume = useDebouncedCallback(async () => {
    const toastId = "auto-save";

    toast.loading("Saving...", { id: toastId });
    try {
      const saveResumeResponse = await useResumeStore.getState().saveResume();
      if (saveResumeResponse) {
        toast.success("Saved", { id: toastId, duration: 1500 });
      }
    } catch {
      toast.error("Failed to save", { id: toastId });
    }
  }, 2000);

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
      router.push("/");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex: latexContent }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to compile LaTeX");
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
      console.log("PDF downloaded successfully!");
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
      </div>
      {currentStep === 1 && <JobAnalysisForm />}
      {currentStep === 2 && <ContentBuilderForm />}
    </>
  );
}
