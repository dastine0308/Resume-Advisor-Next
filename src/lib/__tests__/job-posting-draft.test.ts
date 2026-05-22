import { describe, expect, it } from "vitest";
import type { JobPostingResponse } from "@/lib/api-services";
import type { JobPosting } from "@/types/job-posting";
import {
  buildJobPostingDraftFromAnalysis,
  buildJobPostingDraftFromApi,
  buildJobPostingSavePayload,
  emptyJobPostingDraft,
  evaluateJobPostingSave,
  jobPostingResponseFromDraft,
  jobPostingSyncKey,
  mergeAllRequirements,
} from "../job-posting-draft";

const apiJobPosting: JobPostingResponse = {
  id: "31",
  title: "Risk Analytics Co-op",
  description: "Analyze risk data.",
  job_location: "Remote",
  company: { id: "c1", name: "BC Investment" },
  requirements: ["PowerBI", "Tableau", "agile development"],
  selected_requirements: ["Python", "SQL"],
};

describe("buildJobPostingDraftFromApi", () => {
  it("maps API selected_requirements into draft selectedKeywords", () => {
    const draft = buildJobPostingDraftFromApi(apiJobPosting);
    expect(draft.selectedKeywords).toEqual(["Python", "SQL"]);
    expect(draft.jobDescription).toBe("Analyze risk data.");
    expect(draft.jobPosting?.requirements).toEqual([
      "PowerBI",
      "Tableau",
      "agile development",
      "Python",
      "SQL",
    ]);
  });
});

describe("buildJobPostingDraftFromAnalysis", () => {
  it("replaces structured fields and clears selected keywords after analyze", () => {
    const analyzed: JobPosting = {
      company_name: "Acme",
      title: "Engineer",
      job_location: "Remote",
      requirements: ["TypeScript", "React"],
    };

    const draft = buildJobPostingDraftFromAnalysis(
      {
        ...emptyJobPostingDraft(),
        selectedKeywords: ["Old"],
        jobDescription: "old text",
      },
      analyzed,
    );

    expect(draft.jobPosting?.company_name).toBe("Acme");
    expect(draft.jobPosting?.requirements).toEqual(["TypeScript", "React"]);
    expect(draft.selectedKeywords).toEqual([]);
    expect(draft.jobDescription).toBe("old text");
  });
});

describe("evaluateJobPostingSave", () => {
  it("skips when jobPosting is missing", () => {
    expect(evaluateJobPostingSave(emptyJobPostingDraft())).toEqual({
      status: "skipped",
      reason: "no_job_posting",
    });
  });

  it("skips low-quality postings", () => {
    expect(
      evaluateJobPostingSave({
        jobDescription: "desc",
        selectedKeywords: [],
        jobPosting: {
          company_name: "Unknown",
          title: "Unknown",
          job_location: "Unknown",
        },
      }),
    ).toEqual({ status: "skipped", reason: "low_quality" });
  });

  it("allows persistable postings", () => {
    expect(
      evaluateJobPostingSave({
        jobDescription: "desc",
        selectedKeywords: ["Python"],
        jobPosting: {
          company_name: "Acme",
          title: "Engineer",
          job_location: "Remote",
          requirements: ["Python", "SQL"],
        },
      }),
    ).toEqual({ status: "ready" });
  });
});

describe("buildJobPostingSavePayload", () => {
  it("includes selected_requirements from draft", () => {
    const payload = buildJobPostingSavePayload("31", {
      jobDescription: "Analyze risk data.",
      selectedKeywords: ["Python", "SQL", "agile development"],
      jobPosting: {
        company_name: "BC Investment",
        title: "Risk Analytics Co-op",
        job_location: "Remote",
        requirements: ["PowerBI", "Python", "SQL", "Tableau", "agile development"],
      },
    });

    expect(payload.job_id).toBe("31");
    expect(payload.selected_requirements).toEqual([
      "Python",
      "SQL",
      "agile development",
    ]);
    expect(payload.requirements).toEqual([
      "PowerBI",
      "Python",
      "SQL",
      "Tableau",
      "agile development",
    ]);
  });
});

describe("jobPostingResponseFromDraft", () => {
  it("splits requirements into selected and unselected for React Query cache", () => {
    const response = jobPostingResponseFromDraft(
      "31",
      {
        jobDescription: "Analyze risk data.",
        selectedKeywords: ["Python", "SQL"],
        jobPosting: {
          company_name: "BC Investment",
          title: "Risk Analytics Co-op",
          job_location: "Remote",
          requirements: ["PowerBI", "Python", "SQL", "Tableau"],
        },
      },
      apiJobPosting,
    );

    expect(response.selected_requirements).toEqual(["Python", "SQL"]);
    expect(response.requirements).toEqual(["PowerBI", "Tableau"]);
  });
});

describe("jobPostingSyncKey", () => {
  it("changes when selected requirements change", () => {
    const base = jobPostingSyncKey("31", apiJobPosting);
    const updated = jobPostingSyncKey("31", {
      ...apiJobPosting,
      selected_requirements: ["Python", "SQL", "Go"],
    });
    expect(updated).not.toBe(base);
  });
});

describe("mergeAllRequirements", () => {
  it("deduplicates requirements and selected keywords", () => {
    expect(
      mergeAllRequirements(["Python", "SQL"], ["SQL", "Go"]),
    ).toEqual(["Python", "SQL", "Go"]);
  });
});
