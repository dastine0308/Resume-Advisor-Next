"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button, Dropdown } from "@/components/ui";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { SaveStatusBar, type SaveStatus } from "@/components/resume/SaveStatusBar";
import {
  getUserResumes,
  getResumeById,
  getCoverLetterById,
  getJobPosting,
} from "@/lib/api-services";
import { useCoverLetterStore } from "@/stores";
import { COVER_LETTERS_QUERY_KEY } from "@/hooks/useDocuments";
import { PROFILE_QUERY_KEY } from "@/hooks/useProfile";
import { useAiCredits } from "@/hooks/useAiCredits";
import { AiCreditHint } from "@/components/ui/AiCreditHint";
import { UpgradeProCta } from "@/components/ui/UpgradeProCta";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDownIcon,
  CounterClockwiseClockIcon,
} from "@radix-ui/react-icons";
import type { CoverLetterContent } from "@/types/cover-letter";

const TONE_LIST = [
  { tone: "Professional" as const },
  { tone: "Friendly" as const },
  { tone: "Enthusiastic" as const },
  { tone: "Formal" as const },
];

function CoverLetterPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialCoverLetterId = searchParams.get("id") || null;

  const [resumeTitle, setResumeTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [resumeList, setResumeList] = useState<
    {
      id: string | null;
      jobId: string;
      title: string;
      modifiedDate: string | null;
    }[]
  >([]);
  const [restoreSnapshot, setRestoreSnapshot] = useState<{
    generatedContent: string;
    paragraphs: string[];
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const {
    resumeId,
    setResumeId,
    setJobId,
    setTitle,
    setContent,
    content,
    generatedContent,
    setGeneratedContent,
    setCoverLetterId,
  } = useCoverLetterStore();

  const { canAfford, showUpgradeCta, user } = useAiCredits();

  const updateContentField = <K extends keyof CoverLetterContent>(
    field: K,
    value: CoverLetterContent[K],
  ) => {
    setIsDirty(true);
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const canGenerate = !!resumeId && content?.descriptive_prompt?.trim() !== "";

  useEffect(() => {
    if (saveStatus === "saving") return;

    if (isDirty && content.paragraphs.length > 0) {
      setSaveStatus("unsaved");
    }
  }, [isDirty, content.paragraphs.length, saveStatus]);

  useEffect(() => {
    async function loadData() {
      const [list, coverLetterData] = await Promise.all([
        getUserResumes().then((response) =>
          (response ?? []).map((resume) => ({
            id: resume.id || null,
            jobId: resume.job_id,
            title: resume.title || "Untitled Resume",
            modifiedDate: resume.last_updated,
          })),
        ).catch(() => []),
        initialCoverLetterId
          ? getCoverLetterById(initialCoverLetterId).catch(() => null)
          : Promise.resolve(null),
      ]);

      setResumeList(list);

      if (coverLetterData) {
        setCoverLetterId(initialCoverLetterId!);
        setTitle(coverLetterData.title);
        const savedResumeId = coverLetterData.content.resume_id;
        const matchedResume = savedResumeId
          ? list.find((r) => r.id === savedResumeId)
          : list.find((r) => r.jobId === coverLetterData.job_id);
        if (matchedResume) {
          setResumeId(matchedResume.id);
          setResumeTitle(matchedResume.title);
        }
        setJobId(coverLetterData.job_id);
        setContent(coverLetterData.content);
        setGeneratedContent(coverLetterData.content.paragraphs.join("\n\n"));
        setIsEditing(true);
        setIsDirty(false);
        if (coverLetterData.last_updated) {
          setLastSavedAt(new Date(coverLetterData.last_updated));
          setSaveStatus("saved");
        }
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCoverLetterId]);

  const handleResumeSelect = async (resume: {
    id: string | null;
    jobId: string;
    title: string;
  }) => {
    setResumeTitle(resume.title);
    setResumeId(resume.id);
    setJobId(resume.jobId);
    setContent((prev) => ({ ...prev, resume_id: resume.id }));
  };

  const handleGenerate = async () => {
    if (!resumeId || !content?.descriptive_prompt?.trim()) {
      toast.error("Please select a resume and provide a descriptive prompt");
      return;
    }

    const state = useCoverLetterStore.getState();
    if (
      state.generatedContent.trim() !== "" ||
      state.content.paragraphs.length > 0
    ) {
      setRestoreSnapshot({
        generatedContent: state.generatedContent,
        paragraphs: [...state.content.paragraphs],
      });
    }

    setIsGenerating(true);
    setGeneratedContent("");
    setIsEditing(false);

    const coverLetterTitle = `${content.company || "Cover Letter"} - ${content.position || "Position"}`;
    setTitle(coverLetterTitle);

    try {
      const resumeData = await getResumeById(resumeId);

      let keywords: string[] = [];
      let jobDescription = "";
      let jobCompany = "";
      let jobPosition = "";

      if (resumeData.job_id) {
        try {
          const jobPosting = await getJobPosting(resumeData.job_id);
          keywords = jobPosting?.selected_requirements || [];
          jobDescription = jobPosting?.description || "";
          jobCompany = jobPosting?.company?.name || "";
          jobPosition = jobPosting?.title || "";
        } catch {
          // Job posting not found or failed to fetch — proceed without keywords
        }
      }

      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          keywords,
          jobDescription,
          jobCompany,
          jobPosition,
          recipient: content?.recipient || "Hiring Manager",
          company: content?.company || "",
          position: content?.position || "",
          tone: content?.tone || "Professional",
          userPrompt: content?.descriptive_prompt || "",
          closing: content?.closing_signature || "Your Name",
          personalInfo: {
            firstName: user?.first_name ?? "",
            lastName: user?.last_name ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
            location: user?.location ?? "",
            linkedin: user?.linkedin ?? "",
            github: user?.github ?? "",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate cover letter");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.trim().startsWith("0:")) {
              try {
                const parsed = JSON.parse(line.substring(2));
                if (parsed.text) {
                  fullText += parsed.text;
                  setGeneratedContent(fullText);
                }
              } catch {
                // Failed to parse chunk
              }
            }
          }
        }
      }

      const paragraphs = fullText
        .split("\n\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      setContent((prev) => ({ ...prev, paragraphs: paragraphs }));
      toast.success("Cover letter generated successfully!");
      setIsEditing(true);
      setIsDirty(true);
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate cover letter",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCoverLetterNow = useCallback(async () => {
    const state = useCoverLetterStore.getState();

    if (!state.jobId || state.content.paragraphs.length === 0) return;
    if (!state.title || state.title.trim() === "") return;

    setSaveStatus("saving");

    try {
      const response = await state.saveCoverLetter();
      if (response?.success) {
        const savedAt = new Date();
        setLastSavedAt(savedAt);
        setSaveStatus("saved");
        setIsDirty(false);
        queryClient.invalidateQueries({ queryKey: COVER_LETTERS_QUERY_KEY });
        return;
      }
      setSaveStatus("error");
    } catch {
      setSaveStatus("error");
    }
  }, [queryClient]);

  const debouncedSave = useDebouncedCallback(saveCoverLetterNow, 2000);

  useEffect(() => {
    if (isDirty && content.paragraphs.length > 0) {
      debouncedSave();
    }
  }, [content, isDirty, debouncedSave]);

  useEffect(() => {
    return () => {
      debouncedSave.flush();
      useCoverLetterStore.getState().resetStore();
    };
  }, [debouncedSave]);

  const handleEditContent = (newText: string) => {
    setIsDirty(true);
    setGeneratedContent(newText);
    const paragraphs = newText
      .split("\n\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    setContent((prev) => ({ ...prev, paragraphs }));
  };

  const handleRestoreCoverLetter = () => {
    if (!restoreSnapshot) return;
    setGeneratedContent(restoreSnapshot.generatedContent);
    setContent((prev) => ({
      ...prev,
      paragraphs: restoreSnapshot.paragraphs,
    }));
    setIsEditing(restoreSnapshot.generatedContent.trim() !== "");
    setIsDirty(true);
    setRestoreSnapshot(null);
    toast.success("Cover letter restored");
  };

  return (
    <div className="overflow-auto px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                Cover Letter
              </h1>
              <p className="text-sm text-gray-600 md:text-base">
                Generate AI-powered cover letters tailored to your resume and job
                application. Preview updates in real-time.
              </p>
            </div>
            <SaveStatusBar
              status={saveStatus}
              lastSavedAt={lastSavedAt}
              onRetry={saveStatus === "error" ? () => void saveCoverLetterNow() : undefined}
              className="sm:pt-2"
            />
          </div>
        </div>
        <div className="flex min-h-screen flex-col bg-gray-50">
          <main className="flex w-full flex-1 justify-center">
            <div className="w-full max-w-5xl">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Editor */}
                <section className="rounded-lg bg-white p-5 shadow-sm md:p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        value={content.recipient}
                        label="Recipient"
                        onChange={(e) =>
                          updateContentField("recipient", e.target.value)
                        }
                        placeholder="Hiring Manager"
                        aria-label="Recipient"
                      />
                      <Input
                        value={content.company}
                        label="Company"
                        onChange={(e) =>
                          updateContentField("company", e.target.value)
                        }
                        placeholder="Company, Inc."
                        aria-label="Company"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
                      <Input
                        label="Position"
                        value={content.position}
                        onChange={(e) =>
                          updateContentField("position", e.target.value)
                        }
                        placeholder="Product Manager"
                        aria-label="Position"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex flex-col">
                        <Label>Tone</Label>
                        <Dropdown
                          trigger={
                            <Button
                              variant="outline"
                              className="mt-2 w-full justify-between border-gray-300 font-normal text-gray-700"
                            >
                              {content.tone || "Select"}
                              <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </Button>
                          }
                          items={TONE_LIST.map((r) => ({
                            label: r.tone,
                            value: r.tone,
                            onClick: () => updateContentField("tone", r.tone),
                          }))}
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label>
                          Resume <span className="text-red-500">*</span>
                        </Label>
                        <Dropdown
                          trigger={
                            <Button
                              variant="outline"
                              className="mt-2 w-full justify-between border-gray-300 font-normal text-gray-700"
                              disabled={resumeList.length === 0}
                            >
                              {resumeTitle || "Select a Resume"}
                              <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </Button>
                          }
                          items={resumeList
                            .filter((r) => r.id !== null)
                            .map((r) => ({
                              label: r.title,
                              value: r.title,
                              onClick: () =>
                                handleResumeSelect({
                                  id: r.id,
                                  jobId: r.jobId,
                                  title: r.title,
                                }),
                            }))}
                          disabled={resumeList.length === 0}
                        />
                      </div>
                    </div>

                    <Textarea
                      value={content?.descriptive_prompt || ""}
                      label="Descriptive Prompt"
                      required
                      onChange={(e) =>
                        updateContentField("descriptive_prompt", e.target.value)
                      }
                      placeholder="Example: I want to emphasize my leadership experience and technical skills in cloud architecture. The tone should be enthusiastic and highlight my passion for innovation."
                      aria-label="Prompt"
                      className="min-h-[140px]"
                    />

                    <Input
                      label="Closing / Signature"
                      value={content.closing_signature}
                      onChange={(e) =>
                        updateContentField("closing_signature", e.target.value)
                      }
                      placeholder="Your name"
                      aria-label="Closing"
                    />

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResumeTitle("");
                          setGeneratedContent("");
                          setIsEditing(false);
                          useCoverLetterStore.getState().resetStore();
                          router.push("/dashboard");
                        }}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleGenerate}
                        className="w-full sm:w-auto"
                        disabled={
                          isGenerating ||
                          !canGenerate ||
                          !canAfford("cover_letter")
                        }
                      >
                        {isGenerating ? (
                          "Generating..."
                        ) : (
                          <>
                            Generate with AI
                            <AiCreditHint action="cover_letter" />
                          </>
                        )}
                      </Button>
                    </div>
                    {showUpgradeCta("cover_letter") && canGenerate && (
                      <UpgradeProCta action="cover_letter" />
                    )}
                  </div>
                </section>

                {/* Preview */}
                <aside className="rounded-lg bg-white p-5 shadow-sm md:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {isEditing ? "Editable Preview" : "Live Preview"}
                    </h2>
                    <span className="text-xs text-gray-500">
                      Tone: {content.tone}
                    </span>
                  </div>

                  <div className="mt-4 rounded border border-gray-100 bg-gray-50">
                    {isEditing ? (
                      <Textarea
                        value={generatedContent}
                        onChange={(e) => handleEditContent(e.target.value)}
                        className="h-[420px] w-full resize-none border-0 bg-transparent p-4 text-sm leading-relaxed text-gray-800 focus:outline-none focus:ring-0"
                        placeholder="Your generated cover letter will appear here..."
                      />
                    ) : (
                      <div className="h-[420px] overflow-auto p-4">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                          {generatedContent ||
                            "Click 'Generate with AI' to create your cover letter..."}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {restoreSnapshot && (
                      <Button
                        variant="outline"
                        onClick={handleRestoreCoverLetter}
                        className="flex w-full items-center justify-center gap-2 sm:flex-1"
                        disabled={isGenerating}
                      >
                        <CounterClockwiseClockIcon />
                        Restore
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard?.writeText(generatedContent);
                        toast.success("Copied to clipboard!");
                      }}
                      className="w-full sm:flex-1"
                      disabled={!generatedContent}
                    >
                      Copy
                    </Button>
                    <Button
                      onClick={() => {
                        const blob = new Blob([generatedContent], {
                          type: "text/plain",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "cover-letter.txt";
                        document.body.appendChild(a);
                        a.click();
                        URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      }}
                      className="w-full sm:flex-1"
                      disabled={!generatedContent}
                    >
                      Download
                    </Button>
                  </div>
                </aside>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function CoverLetterPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <CoverLetterPageContent />
    </Suspense>
  );
}
