import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "@/lib/api-client";
import * as apiServices from "@/lib/api-services";
import { loadResumeById } from "../resume-load";

vi.mock("@/lib/api-services");

const sampleResume: apiServices.ResumeDataResponse = {
  id: "1",
  job_id: "8",
  title: "IBM",
  creation_date: "2026-01-01T00:00:00Z",
  last_updated: "2026-01-01T12:00:00Z",
  sections: {
    education: [],
    work_experience: [],
    projects: [],
    leadership: [],
    skills: {
      languages: "",
      developerTools: "",
      technologiesFrameworks: "",
    },
  },
};

const sampleJobPosting: apiServices.JobPostingResponse = {
  id: "8",
  title: "Software Engineer",
  job_location: "Remote",
  company: { id: "c1", name: "IBM" },
  requirements: ["TypeScript"],
  selected_requirements: [],
};

describe("loadResumeById", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns new when resumeId is null", async () => {
    await expect(loadResumeById(null)).resolves.toEqual({ kind: "new" });
    expect(apiServices.getResumeById).not.toHaveBeenCalled();
  });

  it("returns found with resume and job posting", async () => {
    vi.mocked(apiServices.getResumeById).mockResolvedValue(sampleResume);
    vi.mocked(apiServices.getJobPosting).mockResolvedValue(sampleJobPosting);

    await expect(loadResumeById("1")).resolves.toEqual({
      kind: "found",
      resume: sampleResume,
      jobPosting: sampleJobPosting,
    });
  });

  it("returns found with null jobPosting when job fetch fails", async () => {
    vi.mocked(apiServices.getResumeById).mockResolvedValue(sampleResume);
    vi.mocked(apiServices.getJobPosting).mockRejectedValue(
      new ApiRequestError("Job not found", 404),
    );

    await expect(loadResumeById("1")).resolves.toEqual({
      kind: "found",
      resume: sampleResume,
      jobPosting: null,
    });
  });

  it("returns not_found for 404 on resume", async () => {
    vi.mocked(apiServices.getResumeById).mockRejectedValue(
      new ApiRequestError("Resume not found", 404),
    );

    await expect(loadResumeById("2")).resolves.toEqual({
      kind: "not_found",
      id: "2",
    });
  });

  it("returns not_found for 403 on resume", async () => {
    vi.mocked(apiServices.getResumeById).mockRejectedValue(
      new ApiRequestError("Forbidden", 403),
    );

    await expect(loadResumeById("2")).resolves.toEqual({
      kind: "not_found",
      id: "2",
    });
  });

  it("rethrows non-404/403 errors", async () => {
    vi.mocked(apiServices.getResumeById).mockRejectedValue(
      new ApiRequestError("Server error", 500),
    );

    await expect(loadResumeById("1")).rejects.toThrow("Server error");
  });
});
