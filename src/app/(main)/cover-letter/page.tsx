"use client";

import React, { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button, Dropdown } from "@/components/ui";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/Label";
import { getUserResumes, getResumeById } from "@/lib/api-services";
import { useCoverLetterStore } from "@/stores";
import { toast } from "sonner";

export default function CoverLetterPage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [tone, setTone] = useState("Professional");
  const [resumeTitle, setResumeTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [closing, setClosing] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [resumeList, setResumeList] = useState<
    { id: string; jobId: number; title: string; modifiedDate: string }[]
  >([]);

  const {
    resumeId,
    jobId,
    setResumeId,
    setJobId,
    setTitle,
    setContent,
    content,
  } = useCoverLetterStore();

  const toneList = [
    { tone: "Professional" },
    { tone: "Friendly" },
    { tone: "Concise" },
  ];

  const canGenerate = !!resumeId && prompt.trim() !== "";

  useEffect(() => {
    async function fetchResumes() {
      try {
        const response = await getUserResumes();
        const list = response?.length
          ? response.map(
              (resume: {
                id: string;
                job_id: number;
                last_updated: string;
                title: string;
              }) => ({
                id: resume.id,
                jobId: resume.job_id,
                title: resume.title || "Untitled Resume",
                modifiedDate: resume.last_updated,
              }),
            )
          : [];
        setResumeList(list);
      } catch (error) {
        console.error("Failed to fetch resumes:", error);
      }
    }

    fetchResumes();
  }, []);

  // Handle resume selection
  const handleResumeSelect = async (resume: {
    id: string;
    jobId: number;
    title: string;
  }) => {
    setResumeTitle(resume.title);
    setResumeId(resume.id);
    setJobId(resume.jobId);
  };

  // Stream AI-generated cover letter
  const handleGenerate = async () => {
    if (!resumeId || !prompt.trim()) {
      toast.error("Please select a resume and provide a descriptive prompt");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");
    setIsEditing(false);

    // Set title before generation for auto-save
    const coverLetterTitle = `${company || "Cover Letter"} - ${position || "Position"}`;
    setTitle(coverLetterTitle);

    try {
      // Fetch resume data client-side to pass to API
      const resumeData = await getResumeById(resumeId);

      // Fetch job posting keywords if available
      let keywords: string[] = [];
      let jobDescription = "";
      let jobCompany = "";
      let jobPosition = "";
      
      if (resumeData.job_id) {
        try {
          const { getJobPosting } = await import("@/lib/api-services");
          const jobPosting = await getJobPosting(resumeData.job_id.toString());
          
          keywords = jobPosting?.selected_requirements || [];
          jobDescription = jobPosting?.description || "";
          jobCompany = jobPosting?.company_name || "";
          jobPosition = jobPosting?.title || "";
        } catch (error) {
          // Job posting not found or failed to fetch
        }
      }

      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          keywords,
          jobDescription,
          jobCompany,
          jobPosition,
          recipient: recipient || "Hiring Manager",
          company: company || "",
          position: position || "",
          tone,
          userPrompt: prompt,
          closing: closing || "Your Name",
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

          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.trim().startsWith("0:")) {
              try {
                const jsonStr = line.substring(2);
                const parsed = JSON.parse(jsonStr);
                if (parsed.text) {
                  fullText += parsed.text;
                  setGeneratedContent(fullText);
                }
              } catch (e) {
                // Failed to parse chunk
              }
            }
          }
        }
      }

      // Split by double newlines to create paragraphs
      const paragraphs = fullText
        .split("\n\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      // Update store with generated content
      setContent({ paragraphs });
      
      toast.success("Cover letter generated successfully!");
      setIsEditing(true);

      // Trigger save after generation
      setTimeout(() => debouncedSave(), 100);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate cover letter",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Debounced auto-save
  const debouncedSave = useDebouncedCallback(async () => {
    const state = useCoverLetterStore.getState();

    if (!state.jobId || state.content.paragraphs.length === 0) {
      return;
    }

    if (!state.title || state.title.trim() === "") {
      return;
    }

    const toastId = "cover-letter-auto-save";
    toast.loading("Saving cover letter...", { id: toastId });

    try {
      const response = await state.saveCoverLetter();
      if (response?.success) {
        toast.success("Saved", { id: toastId, duration: 1500 });
      } else {
        toast.error("Failed to save", { id: toastId });
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast.error("Failed to save", { id: toastId });
    }
  }, 2000);

  // Trigger auto-save when content changes
  useEffect(() => {
    if (content.paragraphs.length > 0) {
      debouncedSave();
    }
  }, [content, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.flush();
      useCoverLetterStore.getState().resetStore();
    };
  }, [debouncedSave]);

  // Handle manual editing of generated content
  const handleEditContent = (newText: string) => {
    setGeneratedContent(newText);
    const paragraphs = newText
      .split("\n\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    setContent({ paragraphs });
  };

  return (
    <div className="overflow-auto px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Cover Letter
          </h1>
          <p className="text-sm text-gray-600 md:text-base">
            Generate AI-powered cover letters tailored to your resume and job
            application. Preview updates in real-time.
          </p>
        </div>
        <div className="flex min-h-screen flex-col bg-gray-50">
          <main className="flex w-full flex-1 justify-center">
            <div className="w-full max-w-5xl">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Editor */}
                <section className="rounded-lg bg-white p-5 shadow-sm md:p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Recipient</Label>
                        <Input
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="Hiring Manager"
                          aria-label="Recipient"
                        />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Company, Inc."
                          aria-label="Company"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
                      <div>
                        <Label>Position</Label>
                        <Input
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          placeholder="Product Manager"
                          aria-label="Position"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex flex-col">
                        <Label>Tone</Label>
                        <Dropdown
                          trigger={
                            <Button variant="outline" className="w-full">
                              {tone || "Select"}
                            </Button>
                          }
                          items={toneList.map((r) => ({
                            label: r.tone,
                            value: r.tone,
                            onClick: () => setTone(r.tone),
                          }))}
                        />
                      </div>
                      <div className="flex flex-col">
                        <Label>
                          Resume <span className="text-red-500">*</span>
                        </Label>
                        <Dropdown
                          trigger={
                            <Button variant="outline" className="w-full">
                              {resumeTitle || "Select a Resume"}
                            </Button>
                          }
                          items={resumeList.map((r) => ({
                            label: r.title,
                            value: r.title,
                            onClick: () => handleResumeSelect(r),
                          }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>
                        Descriptive Prompt <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Example: I want to emphasize my leadership experience and technical skills in cloud architecture. The tone should be enthusiastic and highlight my passion for innovation."
                        aria-label="Prompt"
                        className="min-h-[140px]"
                      />
                    </div>

                    <div>
                      <Label>Closing / Signature</Label>
                      <Input
                        value={closing}
                        onChange={(e) => setClosing(e.target.value)}
                        placeholder="Your name"
                        aria-label="Closing"
                      />
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRecipient("");
                          setCompany("");
                          setPosition("");
                          setPrompt("");
                          setClosing("");
                          setResumeTitle("");
                          setGeneratedContent("");
                          setIsEditing(false);
                          useCoverLetterStore.getState().resetStore();
                          router.push("/");
                        }}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleGenerate}
                        className="w-full sm:w-auto"
                        disabled={isGenerating || !canGenerate}
                      >
                        {isGenerating ? "Generating..." : "Generate with AI"}
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Preview */}
                <aside className="rounded-lg bg-white p-5 shadow-sm md:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {isEditing ? "Editable Preview" : "Live Preview"}
                    </h2>
                    <span className="text-xs text-gray-500">Tone: {tone}</span>
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

                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigator.clipboard?.writeText(generatedContent)
                      }
                      className="w-full"
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
                      className="w-full"
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
