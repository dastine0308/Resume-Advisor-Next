"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import {
  findLinkedResume,
  mapResumeToListEntry,
  contentWithLinkedResumeId,
  buildCoverLetterDraft,
  persistCoverLetterDraft,
  previewTextToParagraphs,
  coverLetterTitleFromContent,
  type CoverLetterDraft,
  type CoverLetterResumeListEntry,
} from "@/lib/cover-letter-draft";
import { coverLetterPreviewText } from "@/lib/cover-letter-normalize";
import { createThrottledStreamUpdate } from "@/lib/throttled-stream-update";
import { useDebouncedCallback } from "use-debounce";
import { Button, Dropdown } from "@/components/ui";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { SaveStatusBar, type SaveStatus } from "@/components/resume/SaveStatusBar";
import { getResumeById, getJobPosting, type ResumesResponse } from "@/lib/api-services";
import {
  updateCoverLetterCachesAfterSave,
  useSuspenseResumes,
  useSuspenseCoverLetter,
  type CoverLetterLoadResult,
} from "@/hooks/useDocuments";
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
import { CoverLetterContentSkeleton } from "@/components/cover-letter/CoverLetterContentSkeleton";
import type { CoverLetterContent } from "@/types/cover-letter";

const TONE_LIST = [
  { tone: "Professional" as const },
  { tone: "Friendly" as const },
  { tone: "Enthusiastic" as const },
  { tone: "Formal" as const },
];

type EditableCoverLetterLoad = Extract<
  CoverLetterLoadResult,
  { kind: "new" } | { kind: "found" }
>;

function CoverLetterNotFound() {
  const router = useRouter();
  return (
    <div className="overflow-auto px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-5xl text-center">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Cover letter not found
        </h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          This cover letter may have been deleted or you may not have access to
          it.
        </p>
        <Button
          variant="primary"
          className="mt-6"
          onClick={() => router.push("/dashboard")}
        >
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}

function CoverLetterForm({
  routeCoverLetterId,
  coverLetterLoad,
  resumes,
  onFirstPersist,
}: {
  routeCoverLetterId: string | null;
  coverLetterLoad: EditableCoverLetterLoad;
  resumes: ResumesResponse[];
  onFirstPersist?: (coverLetterId: string) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resumeList = useMemo(
    () => resumes.map(mapResumeToListEntry),
    [resumes],
  );

  const linkedResume = useMemo(() => {
    if (coverLetterLoad.kind !== "found") return null;
    return findLinkedResume(resumeList, coverLetterLoad.coverLetter);
  }, [coverLetterLoad, resumeList]);

  const [draft, setDraft] = useState<CoverLetterDraft>(() =>
    buildCoverLetterDraft(coverLetterLoad, linkedResume),
  );
  const [manualResume, setManualResume] =
    useState<CoverLetterResumeListEntry | null>(null);
  const [streamPreview, setStreamPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [restoreSnapshot, setRestoreSnapshot] = useState<string[] | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() =>
    coverLetterLoad.kind === "found" &&
    coverLetterLoad.coverLetter.content.paragraphs.length > 0
      ? "saved"
      : "idle",
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() =>
    coverLetterLoad.kind === "found" && coverLetterLoad.coverLetter.last_updated
      ? new Date(coverLetterLoad.coverLetter.last_updated)
      : null,
  );

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const routeCoverLetterIdRef = useRef(routeCoverLetterId);
  routeCoverLetterIdRef.current = routeCoverLetterId;

  const { canAfford, showUpgradeCta, user } = useAiCredits();

  const selectedResume = manualResume ?? linkedResume;
  const selectedResumeId = selectedResume?.id ?? null;
  const resumeTitle = selectedResume?.title ?? "";
  const { content } = draft;
  const previewText = streamPreview ?? coverLetterPreviewText(content);
  const isEditing = content.paragraphs.length > 0 || streamPreview !== null;

  useEffect(() => {
    if (manualResume) return;
    setDraft((prev) => ({
      ...prev,
      content: contentWithLinkedResumeId(prev.content, linkedResume),
    }));
  }, [linkedResume, manualResume]);

  const updateContentField = <K extends keyof CoverLetterContent>(
    field: K,
    value: CoverLetterContent[K],
  ) => {
    setIsDirty(true);
    setDraft((prev) => ({
      ...prev,
      content: { ...prev.content, [field]: value },
    }));
  };

  const canGenerate =
    !!selectedResumeId && content.descriptive_prompt.trim() !== "";

  useEffect(() => {
    if (saveStatus === "saving") return;
    if (isDirty && content.paragraphs.length > 0) {
      setSaveStatus("unsaved");
    }
  }, [isDirty, content.paragraphs.length, saveStatus]);

  const saveCoverLetterNow = useCallback(async () => {
    const current = draftRef.current;
    const routeId = routeCoverLetterIdRef.current;

    if (!current.jobId || current.content.paragraphs.length === 0) return;

    setSaveStatus("saving");

    try {
      const hadPersistedId = !!(current.coverLetterId ?? routeId);
      const response = await persistCoverLetterDraft(current, routeId);
      if (response?.success && response.cover_letter_id && current.jobId) {
        const savedId = String(response.cover_letter_id);
        const savedAt = new Date();
        const savedTitle = coverLetterTitleFromContent(current.content);

        setDraft((prev) => ({
          ...prev,
          coverLetterId: savedId,
        }));
        updateCoverLetterCachesAfterSave(queryClient, {
          coverLetterId: savedId,
          title: savedTitle,
          jobId: current.jobId,
          content: current.content,
          savedAt,
        });
        setLastSavedAt(savedAt);
        setSaveStatus("saved");
        setIsDirty(false);

        if (!hadPersistedId) {
          onFirstPersist?.(savedId);
          router.replace(
            `/cover-letter?id=${encodeURIComponent(savedId)}`,
            { scroll: false },
          );
        }
        return;
      }
      setSaveStatus("error");
      toast.error("Failed to save cover letter");
    } catch (err) {
      setSaveStatus("error");
      toast.error(
        err instanceof Error ? err.message : "Failed to save cover letter",
      );
    }
  }, [queryClient, router, onFirstPersist]);

  const debouncedSave = useDebouncedCallback(saveCoverLetterNow, 2000);
  const debouncedSaveRef = useRef(debouncedSave);
  debouncedSaveRef.current = debouncedSave;

  const saveFingerprint = useMemo(
    () =>
      JSON.stringify({
        content,
        jobId: draft.jobId,
        coverLetterId: draft.coverLetterId,
      }),
    [content, draft.jobId, draft.coverLetterId],
  );

  useEffect(() => {
    if (isDirty && content.paragraphs.length > 0) {
      debouncedSaveRef.current();
    }
  }, [saveFingerprint, isDirty, content.paragraphs.length]);

  useEffect(() => {
    return () => {
      debouncedSaveRef.current.flush();
    };
  }, []);

  const handleResumeSelect = (resume: CoverLetterResumeListEntry) => {
    setManualResume(resume);
    setIsDirty(true);
    setDraft((prev) => ({
      ...prev,
      jobId: resume.jobId,
      content: { ...prev.content, resume_id: resume.id },
    }));
  };

  const handleGenerate = async () => {
    if (!selectedResumeId || !content.descriptive_prompt.trim()) {
      toast.error("Please select a resume and provide a descriptive prompt");
      return;
    }

    if (content.paragraphs.length > 0) {
      setRestoreSnapshot([...content.paragraphs]);
    }

    setIsGenerating(true);
    setStreamPreview("");

    try {
      const resumeData = await getResumeById(selectedResumeId);

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
          // Job posting not found — proceed without keywords
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
          recipient: content.recipient || "Hiring Manager",
          company: content.company || "",
          position: content.position || "",
          tone: content.tone || "Professional",
          userPrompt: content.descriptive_prompt || "",
          closing: content.closing_signature || "Your Name",
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
      const previewThrottle = createThrottledStreamUpdate(setStreamPreview);

      if (reader) {
        try {
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
                    previewThrottle.push(fullText);
                  }
                } catch {
                  // Failed to parse chunk
                }
              }
            }
          }
        } finally {
          previewThrottle.flush(fullText);
        }
      }

      const paragraphs = previewTextToParagraphs(fullText);
      setStreamPreview(null);
      setDraft((prev) => ({
        ...prev,
        jobId: prev.jobId ?? resumeData.job_id,
        content: { ...prev.content, paragraphs },
      }));
      toast.success("Cover letter generated successfully!");
      setIsDirty(true);
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    } catch (error) {
      setStreamPreview(null);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate cover letter",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditContent = (newText: string) => {
    setIsDirty(true);
    setDraft((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        paragraphs: previewTextToParagraphs(newText),
      },
    }));
  };

  const handleRestoreCoverLetter = () => {
    if (!restoreSnapshot) return;
    setDraft((prev) => ({
      ...prev,
      content: { ...prev.content, paragraphs: restoreSnapshot },
    }));
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
              onRetry={
                saveStatus === "error" ? () => void saveCoverLetterNow() : undefined
              }
              className="sm:pt-2"
            />
          </div>
        </div>
        <div className="flex min-h-screen flex-col bg-gray-50">
          <main className="flex w-full flex-1 justify-center">
            <div className="w-full max-w-5xl">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                              onClick: () => handleResumeSelect(r),
                            }))}
                          disabled={resumeList.length === 0}
                        />
                      </div>
                    </div>

                    <Textarea
                      value={content.descriptive_prompt}
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
                        onClick={() => router.push("/dashboard")}
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
                        value={previewText}
                        onChange={(e) => handleEditContent(e.target.value)}
                        className="h-[420px] w-full resize-none border-0 bg-transparent p-4 text-sm leading-relaxed text-gray-800 focus:outline-none focus:ring-0"
                        placeholder="Your generated cover letter will appear here..."
                      />
                    ) : (
                      <div className="h-[420px] overflow-auto p-4">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                          {previewText ||
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
                        navigator.clipboard?.writeText(previewText);
                        toast.success("Copied to clipboard!");
                      }}
                      className="w-full sm:flex-1"
                      disabled={!previewText}
                    >
                      Copy
                    </Button>
                    <Button
                      onClick={() => {
                        const blob = new Blob([previewText], {
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
                      disabled={!previewText}
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

function CoverLetterPageContent() {
  const coverLetterId = useSearchParams().get("id");
  const { data: coverLetterLoad } = useSuspenseCoverLetter(coverLetterId);
  const { data: resumes } = useSuspenseResumes();
  const [formKey, setFormKey] = useState(() => coverLetterId ?? "__new__");
  const skipRemountForIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!coverLetterId) {
      skipRemountForIdRef.current = null;
      setFormKey("__new__");
      return;
    }
    if (skipRemountForIdRef.current === coverLetterId) {
      skipRemountForIdRef.current = null;
      return;
    }
    setFormKey(coverLetterId);
  }, [coverLetterId]);

  if (coverLetterLoad.kind === "not_found") {
    return <CoverLetterNotFound />;
  }

  return (
    <CoverLetterForm
      key={formKey}
      routeCoverLetterId={coverLetterId}
      coverLetterLoad={coverLetterLoad}
      resumes={resumes}
      onFirstPersist={(id) => {
        skipRemountForIdRef.current = id;
      }}
    />
  );
}

export default function CoverLetterPage() {
  return (
    <Suspense fallback={<CoverLetterContentSkeleton />}>
      <CoverLetterPageContent />
    </Suspense>
  );
}
