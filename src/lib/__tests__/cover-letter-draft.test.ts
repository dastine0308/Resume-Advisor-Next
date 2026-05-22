import { describe, expect, it, vi } from "vitest";
import {
  buildCoverLetterDraft,
  contentWithLinkedResumeId,
  coverLetterTitleFromContent,
  findLinkedResume,
  previewTextToParagraphs,
} from "../cover-letter-draft";
import * as apiServices from "@/lib/api-services";

describe("buildCoverLetterDraft", () => {
  it("builds an empty draft for a new cover letter", () => {
    expect(buildCoverLetterDraft({ kind: "new" }, null)).toEqual({
      coverLetterId: null,
      jobId: null,
      content: {
        paragraphs: [],
        closing_signature: "",
        company: "",
        descriptive_prompt: "",
        position: "",
        recipient: "",
        resume_id: null,
        tone: "Professional",
      },
    });
  });

  it("hydrates a saved cover letter and links resume_id", () => {
    const draft = buildCoverLetterDraft(
      {
        kind: "found",
        coverLetter: {
          id: "2",
          title: "Vertiv - Role",
          job_id: "30",
          creation_date: "2026-01-01T00:00:00Z",
          last_updated: "2026-01-01T11:35:00Z",
          content: {
            paragraphs: ["Dear Hiring Manager"],
            closing_signature: "",
            company: "Vertiv",
            descriptive_prompt: "Highlight data center experience",
            position: "Engineer",
            recipient: "Hiring Manager",
            resume_id: null,
            tone: "Friendly",
          },
        },
      },
      { id: "23", jobId: "30", title: "Vertiv", modifiedDate: null },
    );

    expect(draft.coverLetterId).toBe("2");
    expect(draft.content.company).toBe("Vertiv");
    expect(draft.content.resume_id).toBe("23");
  });
});

describe("findLinkedResume", () => {
  const resumeList = [
    { id: "23", jobId: "30", title: "Vertiv", modifiedDate: null },
    { id: "24", jobId: "31", title: "IBM", modifiedDate: null },
  ];

  it("prefers resume_id match", () => {
    expect(
      findLinkedResume(resumeList, {
        job_id: "31",
        content: { resume_id: "23" },
      }),
    ).toEqual(resumeList[0]);
  });

  it("falls back to job_id match", () => {
    expect(
      findLinkedResume(resumeList, {
        job_id: "30",
        content: { resume_id: null },
      }),
    ).toEqual(resumeList[0]);
  });
});

describe("contentWithLinkedResumeId", () => {
  it("backfills resume_id when missing", () => {
    expect(
      contentWithLinkedResumeId({ resume_id: null }, {
        id: "23",
        jobId: "30",
        title: "Vertiv",
        modifiedDate: null,
      }),
    ).toEqual({ resume_id: "23" });
  });

  it("preserves existing resume_id", () => {
    expect(
      contentWithLinkedResumeId({ resume_id: "24" }, {
        id: "23",
        jobId: "30",
        title: "Vertiv",
        modifiedDate: null,
      }),
    ).toEqual({ resume_id: "24" });
  });
});

describe("previewTextToParagraphs", () => {
  it("splits preview text into paragraph blocks", () => {
    expect(previewTextToParagraphs("Line one\n\nLine two")).toEqual([
      "Line one",
      "Line two",
    ]);
  });
});

describe("coverLetterTitleFromContent", () => {
  it("derives title from company and position", () => {
    expect(
      coverLetterTitleFromContent({
        paragraphs: [],
        closing_signature: "",
        company: "Vertiv - 2",
        descriptive_prompt: "",
        position: "ML Engineer",
        recipient: "",
        resume_id: null,
        tone: "Professional",
      }),
    ).toBe("Vertiv - 2 - ML Engineer");
  });

  it("uses fallbacks when fields are empty", () => {
    expect(
      coverLetterTitleFromContent({
        paragraphs: [],
        closing_signature: "",
        company: "",
        descriptive_prompt: "",
        position: "",
        recipient: "",
        resume_id: null,
        tone: "Professional",
      }),
    ).toBe("Cover Letter - Position");
  });
});

describe("persistCoverLetterDraft", () => {
  it("uses route id when draft coverLetterId is missing", async () => {
    const { persistCoverLetterDraft } = await import("../cover-letter-draft");
    const mockCreate = vi
      .spyOn(apiServices, "createOrUpdateCoverLetter")
      .mockResolvedValue({
        success: true,
        cover_letter_id: "2",
        message: "updated",
      });

    await persistCoverLetterDraft(
      {
        coverLetterId: null,
        jobId: "30",
        content: {
          paragraphs: ["Hello"],
          closing_signature: "",
          company: "Vertiv",
          descriptive_prompt: "",
          position: "Role",
          recipient: "",
          resume_id: "23",
          tone: "Friendly",
        },
      },
      "2",
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "2", job_id: "30" }),
    );
    mockCreate.mockRestore();
  });

  it("derives title from content fields", async () => {
    const { persistCoverLetterDraft } = await import("../cover-letter-draft");
    const mockCreate = vi
      .spyOn(apiServices, "createOrUpdateCoverLetter")
      .mockResolvedValue({
        success: true,
        cover_letter_id: "2",
        message: "updated",
      });

    await persistCoverLetterDraft({
      coverLetterId: "2",
      jobId: "30",
      content: {
        paragraphs: ["Hello"],
        closing_signature: "",
        company: "Vertiv - 2",
        descriptive_prompt: "",
        position: "ML Engineer",
        recipient: "",
        resume_id: "23",
        tone: "Friendly",
      },
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Vertiv - 2 - ML Engineer" }),
    );
    mockCreate.mockRestore();
  });
});
