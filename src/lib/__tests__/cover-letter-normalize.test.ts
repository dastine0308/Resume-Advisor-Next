import { describe, expect, it } from "vitest";
import {
  coverLetterPreviewText,
  normalizeCoverLetter,
  parseCoverLetterContent,
} from "../cover-letter-normalize";

describe("parseCoverLetterContent", () => {
  it("parses JSON string content from the database", () => {
    const content = parseCoverLetterContent(
      JSON.stringify({
        paragraphs: ["Dear Hiring Manager", "I am thrilled to apply."],
        company: "Vertiv",
        tone: "Friendly",
        resume_id: 23,
      }),
    );

    expect(content.company).toBe("Vertiv");
    expect(content.tone).toBe("Friendly");
    expect(content.resume_id).toBe("23");
    expect(content.paragraphs).toHaveLength(2);
  });
});

describe("normalizeCoverLetter", () => {
  it("coerces numeric ids to strings", () => {
    const coverLetter = normalizeCoverLetter({
      id: 2,
      job_id: 30,
      title: "Vertiv - Position",
      creation_date: "2026-01-01T00:00:00Z",
      last_updated: "2026-01-01T11:35:00Z",
      content: {
        paragraphs: ["Hello"],
        company: "Vertiv",
        tone: "Friendly",
        resume_id: 23,
      },
    });

    expect(coverLetter.id).toBe("2");
    expect(coverLetter.job_id).toBe("30");
    expect(coverLetter.content.company).toBe("Vertiv");
  });
});

describe("coverLetterPreviewText", () => {
  it("joins paragraphs for the preview textarea", () => {
    expect(
      coverLetterPreviewText({
        paragraphs: ["Line one", "Line two"],
        closing_signature: "",
        company: "",
        descriptive_prompt: "",
        position: "",
        recipient: "",
        resume_id: null,
        tone: "Professional",
      }),
    ).toBe("Line one\n\nLine two");
  });
});
