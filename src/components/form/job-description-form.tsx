"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { KeywordChip } from "@/components/resume/KeywordChip";
import { useResumeDraftContext } from "@/contexts/ResumeDraftContext";
import { Label } from "@/components/ui/Label";
import { analyzeJobDescription } from "@/lib/api-services";
import { buildJobPostingDraftFromAnalysis, type JobPostingDraft } from "@/lib/job-posting-draft";
import {
  canPersistJobPosting,
  isJobDescriptionTooShort,
  isUnknownField,
  JOB_CORE_FIELD_LABELS,
  JOB_DESCRIPTION_TOO_SHORT_ERROR,
  MIN_JOB_DESCRIPTION_LENGTH,
  type JobCoreField,
} from "@/lib/job-analysis-quality";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { PROFILE_QUERY_KEY } from "@/hooks/useProfile";
import { useAiCredits } from "@/hooks/useAiCredits";
import { AiCreditHint } from "@/components/ui/AiCreditHint";
import { UpgradeProCta } from "@/components/ui/UpgradeProCta";

export default function JobAnalysisForm({
  draft,
  onDraftChange,
}: {
  draft: JobPostingDraft;
  onDraftChange: (updater: (prev: JobPostingDraft) => JobPostingDraft) => void;
}) {
  const queryClient = useQueryClient();
  const { canAfford, showUpgradeCta } = useAiCredits();
  const { draft: resumeDraft, setDraft: setResumeDraft } = useResumeDraftContext();
  const resumeTitle = resumeDraft.title;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { jobDescription, selectedKeywords, jobPosting } = draft;

  const handleAnalyze = useCallback(async () => {
    if (!jobDescription.trim()) {
      setError("Please provide a job description to analyze");
      return;
    }

    if (isJobDescriptionTooShort(jobDescription)) {
      setError(JOB_DESCRIPTION_TOO_SHORT_ERROR);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const respData = await analyzeJobDescription(jobDescription);
      onDraftChange((prev) => buildJobPostingDraftFromAnalysis(prev, respData));
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      console.error("Error analyzing job description:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [jobDescription, onDraftChange, queryClient]);

  const isFormValid = !isJobDescriptionTooShort(jobDescription);
  const uniqueRequirements = useMemo(
    () => [...new Set(jobPosting?.requirements ?? [])],
    [jobPosting?.requirements],
  );
  const hasKeywords = uniqueRequirements.length > 0;
  const needsCoreFieldInput = jobPosting !== null && !canPersistJobPosting(jobPosting);

  const updateCoreField = useCallback(
    (field: JobCoreField, value: string) => {
      if (!jobPosting) return;
      onDraftChange((prev) => ({
        ...prev,
        jobPosting: prev.jobPosting
          ? { ...prev.jobPosting, [field]: value }
          : null,
      }));
    },
    [jobPosting, onDraftChange],
  );

  return (
    <main className="flex w-full flex-1 justify-center overflow-scroll">
      <div className="w-full max-w-5xl space-y-6">
        <div className="border-b border-gray-300 p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900 md:text-xl">
                Name your Resume
                <span className="ml-2 text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-600">
                Give your resume a name to help you stand out
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <Input
                  label="Title"
                  type="text"
                  value={resumeTitle}
                  onChange={(e) =>
                    setResumeDraft((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Resume title or name"
                  aria-label="Resume title"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-300 p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900 md:text-xl">
                Target Job
                <span className="ml-2 text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-600">
                Paste your target job description so we can extract keywords and
                recommend content for your resume.
              </p>
            </div>

            <div className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Textarea
                  label="Job Description"
                  value={jobDescription}
                  onChange={(e) => {
                    const text = e.target.value;
                    onDraftChange((prev) => ({
                      ...prev,
                      jobDescription: text,
                    }));
                  }}
                  placeholder="Paste job description here..."
                  className="min-h-[120px]"
                  aria-label="Job description text area"
                  disabled={isAnalyzing}
                />
                <p className="text-xs text-gray-500">
                  Paste the full job posting ({MIN_JOB_DESCRIPTION_LENGTH}+ characters) including responsibilities and required skills.
                </p>
              </div>

              <div className="mt-2 space-y-2">
                <Button
                  variant="primary"
                  onClick={handleAnalyze}
                  disabled={
                    !isFormValid || isAnalyzing || !canAfford("analyze_job")
                  }
                >
                  {isAnalyzing ? (
                    "Analyzing..."
                  ) : (
                    <>
                      Analyze with AI
                      <AiCreditHint action="analyze_job" />
                    </>
                  )}
                </Button>
                {showUpgradeCta("analyze_job") && isFormValid && (
                  <UpgradeProCta action="analyze_job" />
                )}
              </div>
            </div>
          </div>
        </div>

        {jobPosting && (
          <div className="border-b border-gray-300 p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900 md:text-xl">
                  Job Details
                  <span className="ml-2 text-red-500">*</span>
                </h2>
                <p className="text-sm text-gray-600">
                  Review and edit the extracted company, title, and location before
                  continuing.
                </p>
              </div>

              <div className="space-y-4">
                {needsCoreFieldInput && (
                  <p
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                    role="status"
                  >
                    Complete the highlighted fields below to save this job posting.
                  </p>
                )}

                <Input
                  label={JOB_CORE_FIELD_LABELS.company_name}
                  type="text"
                  value={jobPosting.company_name}
                  onChange={(e) => updateCoreField("company_name", e.target.value)}
                  placeholder="e.g. Acme Corp"
                  aria-label="Company name"
                  className={cn(
                    isUnknownField(jobPosting.company_name) &&
                      "border-amber-400 focus:border-amber-500 focus:ring-amber-500",
                  )}
                />

                <Input
                  label={JOB_CORE_FIELD_LABELS.title}
                  type="text"
                  value={jobPosting.title}
                  onChange={(e) => updateCoreField("title", e.target.value)}
                  placeholder="e.g. Software Engineer"
                  aria-label="Job title"
                  className={cn(
                    isUnknownField(jobPosting.title) &&
                      "border-amber-400 focus:border-amber-500 focus:ring-amber-500",
                  )}
                />

                <Input
                  label={JOB_CORE_FIELD_LABELS.job_location}
                  type="text"
                  value={jobPosting.job_location}
                  onChange={(e) => updateCoreField("job_location", e.target.value)}
                  placeholder="Remote, Hybrid, Toronto ON, or Not specified"
                  aria-label="Job location"
                  className={cn(
                    isUnknownField(jobPosting.job_location) &&
                      "border-amber-400 focus:border-amber-500 focus:ring-amber-500",
                  )}
                />
                <p className="text-xs text-gray-500">
                  If the posting omits location, use &quot;Not specified&quot; or enter
                  Remote / Hybrid / a city.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900 md:text-xl">
                Keywords to Select
              </h2>
              <p className="text-sm text-gray-600">
                Review the extracted keywords and check the ones you possess
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Keywords</Label>
                <p className="text-sm text-gray-600">
                  {uniqueRequirements.filter((k) => selectedKeywords.includes(k)).length} keywords selected
                </p>
              </div>
              <div className="min-h-[300px] rounded-lg border border-gray-200 bg-gray-50 p-4">
                {hasKeywords ? (
                  <div className="flex flex-wrap gap-2">
                    {uniqueRequirements.map((keyword, idx) => (
                      <KeywordChip
                        key={`${keyword}-${idx}`}
                        label={keyword}
                        selected={selectedKeywords.includes(keyword)}
                        onClick={() => {
                          onDraftChange((prev) => {
                            const current = prev.selectedKeywords;
                            const next = current.includes(keyword)
                              ? current.filter((k) => k !== keyword)
                              : [...current, keyword];
                            return { ...prev, selectedKeywords: next };
                          });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[300px] items-center justify-center">
                    <p className="text-center text-sm text-gray-500">
                      Analyze a job description first to see keywords here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
