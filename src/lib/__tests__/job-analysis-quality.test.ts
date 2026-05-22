import { describe, expect, it } from "vitest";
import {
  canPersistJobPosting,
  getMeaningfulRequirements,
  getMissingCoreFields,
  getJobPostingSaveFailureMessage,
  getStep1AdvanceBlockReason,
  hasRequiredJobFields,
  isJobDescriptionTooShort,
  isLowQualityJobAnalysis,
  isUnknownField,
  JOB_LOCATION_NOT_SPECIFIED,
  MIN_JOB_DESCRIPTION_LENGTH,
  normalizeAnalyzedJobLocation,
  nullIfUnknown,
} from "../job-analysis-quality";

describe("isUnknownField", () => {
  it("treats empty and Unknown variants as unknown", () => {
    expect(isUnknownField(undefined)).toBe(true);
    expect(isUnknownField("")).toBe(true);
    expect(isUnknownField("   ")).toBe(true);
    expect(isUnknownField("Unknown")).toBe(true);
    expect(isUnknownField("unknown")).toBe(true);
    expect(isUnknownField("Unknown Company")).toBe(true);
    expect(isUnknownField("Untitled Job Posting")).toBe(true);
  });

  it("treats real values as known", () => {
    expect(isUnknownField("Acme Corp")).toBe(false);
    expect(isUnknownField("Software Engineer")).toBe(false);
  });
});

describe("nullIfUnknown", () => {
  it("returns null for placeholders and trimmed value otherwise", () => {
    expect(nullIfUnknown("Unknown")).toBe(null);
    expect(nullIfUnknown(undefined)).toBe(undefined);
    expect(nullIfUnknown("https://acme.com")).toBe("https://acme.com");
  });
});

describe("isJobDescriptionTooShort", () => {
  it("rejects text below the minimum length", () => {
    expect(isJobDescriptionTooShort("我是工程師 測試")).toBe(true);
    expect(isJobDescriptionTooShort("a".repeat(MIN_JOB_DESCRIPTION_LENGTH - 1))).toBe(
      true,
    );
  });

  it("accepts text at or above the minimum length", () => {
    expect(isJobDescriptionTooShort("a".repeat(MIN_JOB_DESCRIPTION_LENGTH))).toBe(
      false,
    );
  });
});

describe("getMeaningfulRequirements", () => {
  it("filters generic role words echoed from short input", () => {
    expect(getMeaningfulRequirements(["測試", "工程師", "test"])).toEqual([]);
    expect(getMeaningfulRequirements(["TypeScript", "測試", "React"])).toEqual([
      "TypeScript",
      "React",
    ]);
  });
});

describe("normalizeAnalyzedJobLocation", () => {
  it("maps unknown placeholders to Not specified", () => {
    expect(normalizeAnalyzedJobLocation("Unknown")).toBe(JOB_LOCATION_NOT_SPECIFIED);
    expect(normalizeAnalyzedJobLocation("  unknown location  ")).toBe(
      JOB_LOCATION_NOT_SPECIFIED,
    );
  });

  it("preserves real location values", () => {
    expect(normalizeAnalyzedJobLocation("Remote")).toBe("Remote");
    expect(normalizeAnalyzedJobLocation("Toronto, ON")).toBe("Toronto, ON");
    expect(normalizeAnalyzedJobLocation(JOB_LOCATION_NOT_SPECIFIED)).toBe(
      JOB_LOCATION_NOT_SPECIFIED,
    );
  });
});

describe("getMissingCoreFields", () => {
  it("lists fields that still use placeholders", () => {
    expect(
      getMissingCoreFields({
        company_name: "Acme",
        title: "Unknown",
        job_location: JOB_LOCATION_NOT_SPECIFIED,
      }),
    ).toEqual(["title"]);
  });
});

describe("isLowQualityJobAnalysis (UI accept gate)", () => {
  it("allows partial core fields when skills are sufficient", () => {
    expect(
      isLowQualityJobAnalysis({
        company_name: "Unknown",
        title: "Unknown",
        job_location: "Unknown",
        requirements: ["TypeScript", "React", "Node.js"],
      }),
    ).toBe(false);
  });
});

describe("hasRequiredJobFields", () => {
  it("requires all core fields to be real values", () => {
    expect(
      hasRequiredJobFields({
        company_name: "Acme",
        title: "Engineer",
        job_location: "Remote",
      }),
    ).toBe(true);
    expect(
      hasRequiredJobFields({
        company_name: "Unknown",
        title: "Engineer",
        job_location: "Remote",
      }),
    ).toBe(false);
    expect(
      hasRequiredJobFields({
        company_name: "Acme",
        title: "Engineer",
        job_location: JOB_LOCATION_NOT_SPECIFIED,
      }),
    ).toBe(true);
  });
});

describe("canPersistJobPosting", () => {
  it("rejects low-quality and incomplete postings", () => {
    expect(
      canPersistJobPosting({
        company_name: "Unknown",
        title: "Unknown",
        job_location: "Unknown",
        requirements: [],
      }),
    ).toBe(false);
    expect(
      canPersistJobPosting({
        company_name: "Acme",
        title: "Engineer",
        job_location: "Remote",
        requirements: [],
      }),
    ).toBe(true);
  });
});

describe("isLowQualityJobAnalysis", () => {
  it("flags all-unknown results with no requirements", () => {
    expect(
      isLowQualityJobAnalysis({
        company_name: "Unknown",
        title: "Unknown",
        job_location: "Unknown",
        requirements: [],
      }),
    ).toBe(true);
  });

  it("flags minimal Chinese test input with a spurious keyword", () => {
    expect(
      isLowQualityJobAnalysis({
        company_name: "Unknown",
        title: "工程師",
        job_location: "Unknown",
        requirements: ["測試"],
      }),
    ).toBe(true);
  });

  it("flags a lone guessed title with no requirements", () => {
    expect(
      isLowQualityJobAnalysis({
        company_name: "Unknown",
        title: "工程師",
        job_location: "Unknown",
        requirements: [],
      }),
    ).toBe(true);
  });

  it("flags when only one core field is known and requirements are sparse", () => {
    expect(
      isLowQualityJobAnalysis({
        company_name: "Acme Corp",
        title: "Unknown",
        job_location: "Unknown",
        requirements: ["TypeScript"],
      }),
    ).toBe(true);
  });

  it("passes when all core fields are known", () => {
    expect(
      isLowQualityJobAnalysis({
        company_name: "Acme Corp",
        title: "Software Engineer",
        job_location: "Remote",
        requirements: [],
      }),
    ).toBe(false);
  });

  it("passes when at least two core fields and two meaningful skills are known", () => {
    expect(
      isLowQualityJobAnalysis({
        company_name: "Acme Corp",
        title: "Software Engineer",
        job_location: "Unknown",
        requirements: ["TypeScript", "React"],
      }),
    ).toBe(false);
  });

  it("passes when enough meaningful skills were extracted", () => {
    expect(
      isLowQualityJobAnalysis({
        company_name: "Unknown",
        title: "Unknown",
        job_location: "Unknown",
        requirements: ["TypeScript", "React", "Node.js"],
      }),
    ).toBe(false);
  });
});

describe("getJobPostingSaveFailureMessage", () => {
  it("returns distinct messages per skip reason", () => {
    expect(getJobPostingSaveFailureMessage("low_quality")).toContain("company");
    expect(getJobPostingSaveFailureMessage("no_job_posting")).toContain("Analyze");
  });
});

describe("getStep1AdvanceBlockReason", () => {
  it("blocks when resume title or job description is missing", () => {
    expect(
      getStep1AdvanceBlockReason({
        resumeTitle: "",
        jobDescription: "a".repeat(MIN_JOB_DESCRIPTION_LENGTH),
        jobPosting: null,
      }),
    ).toContain("resume title");
    expect(
      getStep1AdvanceBlockReason({
        resumeTitle: "My Resume",
        jobDescription: "",
        jobPosting: null,
      }),
    ).toContain("job description");
  });

  it("blocks until analyze and core fields are complete", () => {
    expect(
      getStep1AdvanceBlockReason({
        resumeTitle: "My Resume",
        jobDescription: "a".repeat(MIN_JOB_DESCRIPTION_LENGTH),
        jobPosting: null,
      }),
    ).toContain("Analyze");

    expect(
      getStep1AdvanceBlockReason({
        resumeTitle: "My Resume",
        jobDescription: "a".repeat(MIN_JOB_DESCRIPTION_LENGTH),
        jobPosting: {
          company_name: "Unknown",
          title: "Engineer",
          job_location: "Remote",
          requirements: [],
        },
      }),
    ).toContain("Company");
  });

  it("returns null when the posting can be persisted", () => {
    expect(
      getStep1AdvanceBlockReason({
        resumeTitle: "My Resume",
        jobDescription: "a".repeat(MIN_JOB_DESCRIPTION_LENGTH),
        jobPosting: {
          company_name: "Acme Corp",
          title: "Software Engineer",
          job_location: "Remote",
          requirements: ["TypeScript"],
        },
      }),
    ).toBeNull();
  });
});

describe("analyze/persist contract", () => {
  it("accepts only when all core fields are present", () => {
    expect(
      canPersistJobPosting({
        company_name: "Acme Corp",
        title: "Software Engineer",
        job_location: "Remote",
        requirements: [],
      }),
    ).toBe(true);
  });

  it("accepts Not specified as a valid location after normalization", () => {
    const fixture = {
      company_name: "Acme Corp",
      title: "Software Engineer",
      job_location: normalizeAnalyzedJobLocation("Unknown"),
      requirements: ["TypeScript", "React"],
    };
    expect(isLowQualityJobAnalysis(fixture)).toBe(false);
    expect(canPersistJobPosting(fixture)).toBe(true);
  });

  it("analyze may pass while persist waits for user to fill core fields", () => {
    const fixture = {
      company_name: "Unknown",
      title: "Unknown",
      job_location: JOB_LOCATION_NOT_SPECIFIED,
      requirements: ["TypeScript", "React", "Node.js"],
    };
    expect(isLowQualityJobAnalysis(fixture)).toBe(false);
    expect(canPersistJobPosting(fixture)).toBe(false);
    expect(getMissingCoreFields(fixture)).toEqual(["company_name", "title"]);
  });

  it("canPersistJobPosting true always implies isLowQualityJobAnalysis false", () => {
    const fixtures = [
      {
        company_name: "Acme Corp",
        title: "Software Engineer",
        job_location: "Remote",
        requirements: [] as string[],
      },
      {
        company_name: "Beta Inc",
        title: "Data Analyst",
        job_location: "Toronto, ON",
        requirements: ["SQL", "Python"],
      },
    ];

    for (const fixture of fixtures) {
      if (canPersistJobPosting(fixture)) {
        expect(isLowQualityJobAnalysis(fixture)).toBe(false);
      }
    }
  });
});
