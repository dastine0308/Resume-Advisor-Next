"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { KeywordChip } from "@/components/resume/KeywordChip";
import { useKeywordsStore, useResumeStore } from "@/stores";
import { Keyword } from "@/types/keywords";
import { Label } from "@/components/ui/Label";

export default function JobAnalysisForm() {
  // Job Description State

  const { resumeId, resumeTitle, setResumeTitle } = useResumeStore();
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keywords State from Store
  const keywordsData = useKeywordsStore((state) => state.keywordsData);
  const toggleKeyword = useKeywordsStore((state) => state.toggleKeyword);

  const handleAnalyze = useCallback(async () => {
    if (!jobDescription.trim()) {
      setError("Please provide a job description to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-job-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription: jobDescription,
          resumeId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze job description");
      }

      const data = await JSON.parse(await response.text())?.data;

      // Update Zustand store with the fetched keywords data
      useKeywordsStore.getState().setJobId(data.jobId);
      useKeywordsStore.getState().setKeywordsData([
        ...data?.keywords.map((keyword: Keyword) => ({
          ...keyword,
          selected: false,
        })),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      console.error("Error analyzing job description:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [jobDescription, resumeId]);

  const isFormValid = jobDescription.trim() !== "";
  const hasKeywords = keywordsData.length > 0;

  return (
    <main className="flex w-full flex-1 justify-center overflow-scroll">
      <div className="w-full max-w-5xl space-y-6">
        {/* Section 1: Name Resume Section - Title and Content Side by Side */}
        <div className="border-b border-gray-300 p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
            {/* Left: Title and Description */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900 md:text-xl">
                Name your Resume
                <span className="ml-2 text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-600">
                Give your resume a name to help you stand out
              </p>
            </div>
            {/* Right: Title input (resume title) */}
            <div className="space-y-6">
              <div>
                <Input
                  label="Title"
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  placeholder="Resume title or name"
                  aria-label="Resume title"
                />
              </div>

              {/* (Top section intentionally only includes the Title input) */}
            </div>
          </div>
        </div>

        {/* Target Job section (stacked below) */}
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
              {/* Title input removed from bottom section */}
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
                    setJobDescription(text);
                  }}
                  placeholder="Paste job description here..."
                  className="min-h-[120px]"
                  aria-label="Job description text area"
                  disabled={isAnalyzing}
                />
              </div>

              <div className="mt-2">
                <Button
                  variant="primary"
                  onClick={handleAnalyze}
                  disabled={!isFormValid || isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Keywords Selection - Title and Content Side by Side */}
        <div className="p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
            {/* Left: Title and Description */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900 md:text-xl">
                Keywords to Select
                <span className="ml-2 text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-600">
                Review the extracted keywords and check the ones you possess
              </p>
            </div>

            {/* Right: Keywords Content */}
            <div className="space-y-3">
              <Label>Keywords</Label>
              <div className="min-h-[300px] rounded-lg border border-gray-200 bg-gray-50 p-4">
                {hasKeywords ? (
                  <div className="flex flex-wrap gap-2">
                    {keywordsData.map((keyword) => (
                      <KeywordChip
                        key={keyword.id}
                        label={keyword.label}
                        selected={keyword.selected}
                        onClick={() => toggleKeyword(keyword.id)}
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
