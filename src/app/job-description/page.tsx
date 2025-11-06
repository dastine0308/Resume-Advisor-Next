"use client";

import React from "react";
import { Navigation } from "@/components/resume/Navigation";
import { ProgressBar } from "@/components/resume/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useJobDescription } from "@/hooks/useJobDescription";

export default function JobDescriptionPage() {
  const {
    jobDescription,
    jobUrl,
    isLoading,
    error,
    setJobDescription,
    setJobUrl,
    handleSubmit,
    handleCancel,
    isFormValid,
  } = useJobDescription();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Progress Bar */}
      <ProgressBar
        currentStep={1}
        totalSteps={3}
        label="Step 1 of 3 - Job Description Analysis"
      />

      {/* Main Content */}
      <main className="flex w-full flex-1 justify-center px-4 py-5 md:px-5 md:py-10">
        <div className="w-full max-w-[900px]">
          {/* Header */}
          <div className="mb-10 space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Job Description Analysis
            </h1>
            <p className="text-sm text-gray-600 md:text-base">
              Paste your target job description so we can tailor your resume to
              match the role
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-lg bg-white p-5 shadow-sm md:p-8">
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Job Description Textarea */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-800">
                  Job Description
                </label>
                <p className="text-xs text-gray-500">
                  Paste the full job posting or provide a link
                </p>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here..."
                  className="min-h-[120px]"
                  aria-label="Job description text area"
                  disabled={isLoading}
                />
              </div>

              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-800">
                  Or provide a URL
                </label>
                <p className="text-xs text-gray-500">
                  We&apos;ll extract the job description from the link
                </p>
                <Input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://example.com/job-posting"
                  aria-label="Job posting URL"
                  disabled={isLoading}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 md:flex-row md:justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full md:w-auto"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  className="w-full disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? "Processing..." : "Enrich with AI"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
