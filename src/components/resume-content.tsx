"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/resume/ProgressBar";
import { useResumeStore } from "@/stores";
import { generateLatexFromData } from "@/lib/latex-generator";
import { ResumeData } from "@/types/resume";
import ContentBuilderForm from "@/components/form/content-builder-form";
import JobAnalysisForm from "@/components/form/job-description-form";

interface ResumeContentProps {
  resumeId?: string | null;
  resumeData?: ResumeData | null;
}

export function ResumeContent({
  resumeId: initialResumeId,
  resumeData: initialResumeData,
}: ResumeContentProps) {
  const router = useRouter();
  const { setResumeId, setResumeData, currentStep, setCurrentStep } =
    useResumeStore();

  useEffect(() => {
    setResumeId(initialResumeId || "");
    if (initialResumeData) {
      setResumeData(initialResumeData);
    }
  }, [initialResumeId, initialResumeData]);

  useEffect(() => {
    return () => {
      console.log("Save resumeData:", useResumeStore.getState().resumeData);
      // Clear resume store on unmount to avoid stale data
      useResumeStore.getState().resetStore();
    };
  }, []);

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
