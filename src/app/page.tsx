"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [mode, setMode] = useState<"job" | "manual">("job");
  const [jobDescription, setJobDescription] = useState("");
  const [suggestions, setSuggestions] = useState("");

  const [resumeData, setResumeData] = useState({
    experience: [""],
    education: [""],
    skills: [""],
    summary: [""],
  });

  const handleAdd = (field: keyof typeof resumeData) => {
    setResumeData({ ...resumeData, [field]: [...resumeData[field], ""] });
  };

  const handleChange = (
    field: keyof typeof resumeData,
    index: number,
    value: string,
  ) => {
    const updated = [...resumeData[field]];
    updated[index] = value;
    setResumeData({ ...resumeData, [field]: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "job") {
      setSuggestions(
        "Suggested keywords:\n• React.js  • TypeScript  • AWS\n\nSample Summary:\nSoftware engineer experienced in full-stack web development and cloud deployment.",
      );
    } else {
      setSuggestions(
        `Generated Resume Outline:\n\n` +
          `Experience:\n${resumeData.experience.join("\n- ")}\n\n` +
          `Education:\n${resumeData.education.join("\n- ")}\n\n` +
          `Skills:\n${resumeData.skills.join(", ")}\n\n` +
          `Summary:\n${resumeData.summary.join("\n")}`,
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      {/* ─── Header ───────────────────────────────────────────── */}
      <header className="flex items-center justify-between bg-white px-8 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-700">Resume Advisor</h1>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* ─── Main ──────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-lg">
          {/* Toggle Mode */}
          <div className="mb-8 flex justify-center">
            <button
              onClick={() => setMode("job")}
              className={`rounded-l-lg border px-6 py-2 ${
                mode === "job"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Paste Job Description
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`rounded-r-lg border px-6 py-2 ${
                mode === "manual"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Enter Resume Details
            </button>
          </div>

          {/* Job Mode */}
          {mode === "job" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label
                  htmlFor="jobDescription"
                  className="mb-2 block text-sm font-medium"
                >
                  Paste Job Description or Link
                </label>
                <textarea
                  id="jobDescription"
                  placeholder="e.g. Software Engineer at Google — React, Next.js, AWS…"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[120px] w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="self-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700"
              >
                Generate Suggestions
              </button>
            </form>
          )}

          {/* Manual Mode */}
          {mode === "manual" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              {Object.keys(resumeData).map((sectionKey) => {
                const field = sectionKey as keyof typeof resumeData;
                return (
                  <div key={field}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium capitalize">
                        {field}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAdd(field)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        + Add New
                      </button>
                    </div>

                    {resumeData[field].map((value, i) => (
                      <textarea
                        key={i}
                        value={value}
                        onChange={(e) => handleChange(field, i, e.target.value)}
                        placeholder={`Enter ${field} #${i + 1}`}
                        className="mb-3 min-h-[80px] w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ))}
                  </div>
                );
              })}

              <button
                type="submit"
                className="self-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700"
              >
                Generate Resume
              </button>
            </form>
          )}

          {/* Suggestions */}
          {suggestions && (
            <div className="mt-8">
              <h2 className="mb-2 text-xl font-semibold">AI Suggestions</h2>
              <pre className="whitespace-pre-wrap rounded-lg bg-gray-100 p-4">
                {suggestions}
              </pre>
            </div>
          )}
        </div>
      </main>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Resume Advisor
      </footer>
    </div>
  );
}
