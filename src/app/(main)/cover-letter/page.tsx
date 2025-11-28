"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button, Dropdown } from "@/components/ui";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import {
  getUserResumes,
  getResumeById,
  getCoverLetterById,
} from "@/lib/api-services";
import { useCoverLetterStore, useAccountStore } from "@/stores";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "@radix-ui/react-icons";

function CoverLetterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCoverLetterId = searchParams.get("id");

  const [resumeTitle, setResumeTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [resumeList, setResumeList] = useState<
    { id: string; jobId: number; title: string; modifiedDate: string }[]
  >([]);

  const {
    resumeId,
    setResumeId,
    setJobId,
    setTitle,
    setContent,
    content,
    generatedContent,
    setGeneratedContent,
    coverLetterId,
    setCoverLetterId,
  } = useCoverLetterStore();

  const { user } = useAccountStore();

  // Helper to update content fields
  const updateContentField = <K extends keyof typeof content>(
    field: K,
    value: (typeof content)[K],
  ) => {
    setIsDirty(true);
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const toneList = [
    { tone: "Professional" as const },
    { tone: "Friendly" as const },
    { tone: "Enthusiastic" as const },
    { tone: "Formal" as const },
  ];

  const canGenerate = !!resumeId && content?.descriptive_prompt?.trim() !== "";

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
        return list;
      } catch (error) {
        console.error("Failed to fetch resumes:", error);
        return [];
      }
    }

    async function loadData() {
      const list = await fetchResumes();

      if (initialCoverLetterId) {
        setCoverLetterId(Number(initialCoverLetterId));
        try {
          const data = await getCoverLetterById(initialCoverLetterId);
          if (data) {
            setTitle(data.title);
            const matchedResume = list.find(
              (r: { jobId: number }) => r.jobId === data.job_id,
            );
            if (matchedResume) {
              setResumeId(matchedResume.id);
              setResumeTitle(matchedResume.title);
            }
            setJobId(data.job_id);
            setContent(data.content);
            const generatedText = data.content.paragraphs.join("\n\n");
            setGeneratedContent(generatedText);
            setIsEditing(true);
          }
        } catch (error) {
          console.error("Failed to fetch cover letter:", error);
        }
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverLetterId]);

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
    if (!resumeId || !content?.descriptive_prompt?.trim()) {
      toast.error("Please select a resume and provide a descriptive prompt");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");
    setIsEditing(false);

    // Set title before generation for auto-save
    const coverLetterTitle = `${content.company || "Cover Letter"} - ${content.position || "Position"}`;
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
        } catch {
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
          recipient: content?.recipient || "Hiring Manager",
          company: content?.company || "",
          position: content?.position || "",
          tone: content?.tone || "Professional",
          userPrompt: content?.descriptive_prompt || "",
          closing: content?.closing_signature || "Your Name",
          personalInfo: {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            location: user.location,
            linkedin: user.linkedin,
            github: user.github,
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
              } catch {
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

      // TEST:
      // const test = [
      //   "[Your Address]  \n[City, State, Zip]  \n[Email Address]  \n[Phone Number]  \n[Date]",
      //   "Hiring Manager  \n[Company Name]  \n[Company Address]  \n[City, State, Zip]",
      //   "Dear Hiring Manager,",
      //   "I am writing to express my interest in the Senior Software Engineer position at [Company Name], as advertised. With a Bachelor of Science in Computer Science from the University of Calgary and relevant experience in software development, I am confident in my ability to contribute effectively to your team. My background includes solid foundational knowledge in programming, particularly within Python, as well as exposure to essential technologies such as AWS and Docker.",
      //   "During my tenure as a Software Engineer Intern at the University of Calgary, I was responsible for designing and implementing a comprehensive coding curriculum that enabled secondary school students to grasp complex programming concepts in languages including Python. This experience not only honed my technical skills but also reinforced my ability to communicate effectively with diverse audiences—a crucial competency for any collaborative engineering team.",
      //   "Moreover, my academic projects have provided me with a robust understanding of software development methodologies, including hands-on experience with Docker. I appreciate the importance of containerization in modern software engineering, especially within cloud environments like AWS. I am eager to apply my knowledge of these technologies to develop scalable and efficient solutions that align with [Company Name]'s strategic goals.",
      //   "I am particularly drawn to [Company Name] due to its commitment to innovation and excellence in the tech industry. I am enthusiastic about the opportunity to bring my unique expertise to your esteemed organization and contribute to projects that drive impactful results.",
      //   "Thank you for considering my application. I look forward to the possibility of discussing how my skills and experiences align with the needs of your team.",
      //   "Sincerely,  \nYour Name",
      // ];

      // // Update store with generated content (preserve other content fields)
      setContent((prev) => ({ ...prev, paragraphs: paragraphs }));

      toast.success("Cover letter generated successfully!");
      setIsEditing(true);
      setIsDirty(true);
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

  // Trigger auto-save when content changes (only if user has made modifications)
  useEffect(() => {
    if (isDirty && content.paragraphs.length > 0) {
      debouncedSave();
    }
  }, [content, isDirty, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.flush();
      useCoverLetterStore.getState().resetStore();
    };
  }, [debouncedSave]);

  // Handle manual editing of generated content
  const handleEditContent = (newText: string) => {
    setIsDirty(true);
    setGeneratedContent(newText);
    const paragraphs = newText
      .split("\n\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    setContent((prev) => ({ ...prev, paragraphs }));
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
                          value={content.recipient}
                          onChange={(e) =>
                            updateContentField("recipient", e.target.value)
                          }
                          placeholder="Hiring Manager"
                          aria-label="Recipient"
                        />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input
                          value={content.company}
                          onChange={(e) =>
                            updateContentField("company", e.target.value)
                          }
                          placeholder="Company, Inc."
                          aria-label="Company"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
                      <div>
                        <Label>Position</Label>
                        <Input
                          value={content.position}
                          onChange={(e) =>
                            updateContentField("position", e.target.value)
                          }
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
                            <Button
                              variant="outline"
                              className="w-full justify-between border-gray-300 font-normal text-gray-700"
                            >
                              {content.tone || "Select"}
                              <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </Button>
                          }
                          items={toneList.map((r) => ({
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
                              className="w-full justify-between border-gray-300 font-normal text-gray-700"
                              disabled={resumeList.length === 0}
                            >
                              {resumeTitle || "Select a Resume"}
                              <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </Button>
                          }
                          items={resumeList.map((r) => ({
                            label: r.title,
                            value: r.title,
                            onClick: () => handleResumeSelect(r),
                          }))}
                          disabled={resumeList.length === 0}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>
                        Descriptive Prompt{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        value={content?.descriptive_prompt || ""}
                        onChange={(e) =>
                          updateContentField(
                            "descriptive_prompt",
                            e.target.value,
                          )
                        }
                        placeholder="Example: I want to emphasize my leadership experience and technical skills in cloud architecture. The tone should be enthusiastic and highlight my passion for innovation."
                        aria-label="Prompt"
                        className="min-h-[140px]"
                      />
                    </div>

                    <div>
                      <Label>Closing / Signature</Label>
                      <Input
                        value={content.closing_signature}
                        onChange={(e) =>
                          updateContentField(
                            "closing_signature",
                            e.target.value,
                          )
                        }
                        placeholder="Your name"
                        aria-label="Closing"
                      />
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
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

                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard?.writeText(generatedContent);
                        toast.success("Copied to clipboard!");
                      }}
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

export default function CoverLetterPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <CoverLetterPageContent />
    </Suspense>
  );
}
