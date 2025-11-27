"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Button, Dropdown, } from "@/components/ui"
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/Label";
import { getUserResumes } from "@/lib/api-services";

export default function CoverLetterPage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [tone, setTone] = useState("Professional");
  const [resumeTitle, setResumeTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [closing, setClosing] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resumeList, setResumeList] = useState<{ id: string; jobId: number; title: string; modifiedDate: string }[]>([]);
  const toneList = [
    { tone: "Professional" },
    { tone: "Friendly" },
    { tone: "Concise" },
  ]

  const canGenerate = resumeTitle.trim() !== "" && prompt.trim() !== "";

  useEffect(() => {
    async function fetchResumes() {
      try {
        const response = await getUserResumes();
        const list = response?.length
          ? response.map((resume:{
              id: string;
              job_id: number;
              last_updated: string;
              title: string;
            }) => ({
              id: resume.id,
              jobId: resume.job_id,
              title: resume.title || "Untitled Resume",
              modifiedDate: resume.last_updated,
            }))
          : [];
        setResumeList(list);
      } catch (error) {
        console.error("Failed to fetch resumes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResumes();
  }, []);


// change with LLM API
  const composed = useMemo(() => {
    return `Dear ${recipient || "Hiring Manager"},\n\n${prompt}\n\nSincerely,\n${closing || "Your Name"}`;
  }, [recipient, closing]);
  
  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      // Placeholder: in future call AI API to generate text
      await new Promise((res) => setTimeout(res, 700));
      if (!closing) setClosing("First Last");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-auto px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Cover Letter
          </h1>
          <p className="text-sm text-gray-600 md:text-base">
            Compose and preview your tailored cover letter. Preview updates live
            on the right on larger screens.
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
                        <Label>
                          Recipient
                        </Label>
                        <Input
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="Hiring Manager"
                          aria-label="Recipient"
                        />
                      </div>
                      <div>
                        <Label>
                          Company
                        </Label>
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
                        <Label>
                          Position
                        </Label>
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
                        <Label>
                          Tone
                        </Label>
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
                        <Label>Resume</Label>
                        <Dropdown
                          trigger={
                            <Button variant="outline" className="w-full">
                              {resumeTitle || "Select a Resume"}
                            </Button>
                          }
                          items={resumeList.map((r) => ({
                            label: r.title,
                            value: r.title,
                            onClick: () => setResumeTitle(r.title),
                          }))}
                        />
                      </div>
                    </div>
                   
                    <div>
                      <Label>
                        Descriptive Prompt
                      </Label>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Add any descriptors you would like to note before generation..."
                        aria-label="Prompt"
                        className="min-h-[140px]"
                      />
                    </div>

                    <div>
                      <Label>
                        Closing / Signature
                      </Label>
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
                        disabled={isLoading || !canGenerate}
                      >
                        {isLoading ? "Generating..." : "Generate with AI"}
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Preview */}
                <aside className="rounded-lg bg-white p-5 shadow-sm md:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Live Preview
                    </h2>
                    <span className="text-xs text-gray-500">Tone: {tone}</span>
                  </div>

                  <div className="mt-4 flex h-[420px] flex-col overflow-auto rounded border border-gray-100 bg-gray-50 p-4">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                      {composed}
                    </pre>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => navigator.clipboard?.writeText(composed)}
                      className="w-full"
                    >
                      Copy
                    </Button>
                    <Button
                      onClick={() => {
                        const blob = new Blob([composed], {
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
