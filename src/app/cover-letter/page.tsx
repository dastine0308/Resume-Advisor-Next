"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useRouter } from "next/navigation";

export default function CoverLetterPage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [tone, setTone] = useState("Professional");
  const [intro, setIntro] = useState("");
  const [body, setBody] = useState("");
  const [closing, setClosing] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const composed = useMemo(() => {
    return `Dear ${recipient || "Hiring Manager"},\n\n${intro}\n\n${body}\n\nSincerely,\n${closing || "Your Name"}`;
  }, [recipient, intro, body, closing]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      // Placeholder: in future call AI API to generate text
      await new Promise((res) => setTimeout(res, 700));
      if (!intro)
        setIntro(
          `I am excited to apply for the ${position || "role"} at ${company || "your company"}.`,
        );
      if (!body)
        setBody(
          "I bring relevant experience and a strong passion for solving problems. I would welcome the chance to contribute to your team.",
        );
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
                        <label className="text-sm font-medium text-gray-700">
                          Recipient
                        </label>
                        <Input
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="Hiring Manager"
                          aria-label="Recipient"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Company
                        </label>
                        <Input
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Company, Inc."
                          aria-label="Company"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Position
                        </label>
                        <Input
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          placeholder="Product Manager"
                          aria-label="Position"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Tone
                        </label>
                        <select
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option>Professional</option>
                          <option>Friendly</option>
                          <option>Concise</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Introduction
                      </label>
                      <Textarea
                        value={intro}
                        onChange={(e) => setIntro(e.target.value)}
                        placeholder="Start with a strong opening sentence..."
                        aria-label="Introduction"
                        className="min-h-[90px]"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Body
                      </label>
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Describe your fit, achievements and motivation..."
                        aria-label="Body"
                        className="min-h-[140px]"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Closing / Signature
                      </label>
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
                          setIntro("");
                          setBody("");
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
                        disabled={isLoading}
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
