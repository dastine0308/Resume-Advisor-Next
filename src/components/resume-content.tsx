"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/resume/ProgressBar";
import { useResumeStore, useAccountStore } from "@/stores";
import { generateLatexFromData } from "@/lib/latex-generator";
import { ResumeData } from "@/types/resume";
import ContentBuilderForm from "@/components/form/content-builder-form";
import JobAnalysisForm from "@/components/form/job-description-form";
import { getResumeById } from "@/lib/api-services";

interface ResumeContentProps {
  resumeId?: string | null;
}

export function ResumeContent({
  resumeId: initialResumeId,
}: ResumeContentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!!initialResumeId);
  const {
    jobId,
    resumeTitle,
    resumeData,
    currentStep,
    setResumeId,
    setResumeData,
    setCurrentStep,
    setJobId,
    setResumeTitle,
    resetStore,
  } = useResumeStore();
  const user = useAccountStore((state) => state.user);

  // Helper to build personalInfo from account store
  const getPersonalInfoFromAccount = useCallback(() => {
    return {
      name: `${user.first_name} ${user.last_name}`.trim() || "",
      email: user.email || "",
      phone: user.phone || "",
      linkedin: user.linkedin || "",
      github: user.github || "",
    };
  }, [user]);

  const fetchResumeData = useCallback(() => {
    if (initialResumeId) {
      setIsLoading(true);
      getResumeById(initialResumeId)
        .then((response) => {
          console.log("Fetched resume data:", response);
          setResumeData({
            personalInfo: getPersonalInfoFromAccount(),
            education: response?.sections?.education || [],
            experience: response?.sections?.work_experience || [],
            projects: response?.sections?.projects || [],
            leadership: response?.sections?.leadership || [],
            technicalSkills: response?.sections?.skills || {
              languages: "",
              developerTools: "",
              technologiesFrameworks: "",
            },
          });
          setJobId(response.job_id);
          setResumeTitle(response.title);
        })
        .catch((error) => {
          console.error("Failed to fetch resume data:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [
    initialResumeId,
    getPersonalInfoFromAccount,
    setResumeData,
    setJobId,
    setResumeTitle,
  ]);

  useEffect(() => {
    if (initialResumeId) {
      // Editing existing resume
      setResumeId(initialResumeId);
      fetchResumeData();
    } else {
      // Creating new resume - reset store and populate personalInfo from account
      resetStore();
      // Ensure personalInfo is populated after reset (handles hydration timing)
      setResumeData((prev) => ({
        ...prev,
        personalInfo: getPersonalInfoFromAccount(),
      }));
    }
  }, [
    initialResumeId,
    setResumeId,
    fetchResumeData,
    resetStore,
    setResumeData,
    getPersonalInfoFromAccount,
  ]);

  // Update personalInfo when user data changes (e.g., after hydration from localStorage)
  useEffect(() => {
    if (user.email || user.first_name || user.last_name) {
      setResumeData((prev) => ({
        ...prev,
        personalInfo: getPersonalInfoFromAccount(),
      }));
    }
  }, [user, setResumeData, getPersonalInfoFromAccount]);

  // Debounced auto-save: saves 2 seconds after user stops editing
  const debouncedSave = useDebouncedCallback(async () => {
    // Skip if no jobId (required field)
    if (!jobId) {
      console.log("Auto-save skipped: missing jobId");
      return;
    }

    console.log("Auto-saving resumeData...");
    const response = await useResumeStore.getState().saveResume();
    if (response) {
      console.log("Auto-save successful:", response);
    }
  }, 2000);

  // Trigger auto-save when data changes
  useEffect(() => {
    debouncedSave();
  }, [resumeData, jobId, resumeTitle, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.flush(); // Save any pending changes immediately
      useResumeStore.getState().resetStore();
    };
  }, [debouncedSave]);

  const steps = [
    {
      label: "Job Description Analysis",
      backButtonLabel: "Cancel",
      nextButtonLabel: "Next",
    },
    {
      label: "Content Builder",
      backButtonLabel: "Back",
      nextButtonLabel: "Export",
    },
  ];

  const handleBack = () => {
    if (currentStep === 1) {
      router.push("/");
      return;
    }
    setCurrentStep(currentStep - 1);
  };

  const handleNext = () => {
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
