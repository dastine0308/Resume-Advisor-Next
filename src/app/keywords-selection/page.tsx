"use client";

import React from "react";
import { Navigation } from "@/components/resume/Navigation";
import { ProgressBar } from "@/components/resume/ProgressBar";
import { Button } from "@/components/ui/Button";
import { KeywordChip } from "@/components/resume/KeywordChip";
import { useKeywordsSelection } from "@/hooks/useKeywordsSelection";

export default function KeywordsSelectionPage() {
  const { keywordsData, toggleKeyword, handleNext, handleBack } =
    useKeywordsSelection();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Progress Bar */}
      <ProgressBar
        currentStep={2}
        totalSteps={3}
        label="Step 2 of 3 - Keywords Selection"
      />

      {/* Main Content */}
      <main className="flex w-full flex-1 justify-center px-4 py-5 md:px-5 md:py-10">
        <div className="w-full max-w-[860px]">
          {/* Form Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm md:p-8">
            {/* Header */}
            <div className="mb-6 space-y-2">
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                Keywords Selection
              </h1>
              <p className="text-sm text-gray-600 md:text-base">
                Review the extracted keywords and check the ones you possess
              </p>
            </div>

            {/* Keywords Section */}
            <div className="mb-8 space-y-3">
              <h2 className="text-sm font-bold text-gray-800">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {keywordsData.length > 0 ? (
                  keywordsData.map((keyword) => (
                    <KeywordChip
                      key={keyword.id}
                      label={keyword.label}
                      selected={keyword.selected}
                      onClick={() => toggleKeyword(keyword.id)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No keywords extracted. Please go back and analyze a job
                    description first.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Desktop */}
          <div className="mt-6 hidden items-center justify-end gap-3 md:flex">
            <Button variant="outline" onClick={handleBack} className="w-auto">
              Back
            </Button>
            <Button onClick={handleNext} className="w-auto px-8">
              Next
            </Button>
          </div>

          {/* Action Buttons - Mobile (Stacked) */}
          <div className="mt-6 flex flex-col gap-3 md:hidden">
            <Button variant="outline" onClick={handleBack} className="w-full">
              Back
            </Button>
            <Button onClick={handleNext} className="w-full">
              Next
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
