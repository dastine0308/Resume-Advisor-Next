import { describe, it, expect } from "vitest";
import { summarizeSectionChanges } from "../resume-version-diff";

describe("summarizeSectionChanges", () => {
  it("returns initial message when there is no baseline", () => {
    expect(
      summarizeSectionChanges(null, {
        education: [],
        work_experience: [],
        projects: [],
        leadership: [],
        skills: { languages: "", developerTools: "", technologiesFrameworks: "" },
      }),
    ).toBe("Initial saved version");
  });

  it("detects updated experience entries", () => {
    const before = {
      education: [],
      work_experience: [
        {
          id: "exp-1",
          jobTitle: "Engineer",
          company: "Tech Corp",
          description: "Old bullets",
        },
      ],
      projects: [],
      leadership: [],
      skills: { languages: "Python", developerTools: "", technologiesFrameworks: "" },
    };
    const after = {
      ...before,
      work_experience: [
        {
          id: "exp-1",
          jobTitle: "Engineer",
          company: "Tech Corp",
          description: "New bullets",
        },
      ],
    };

    expect(summarizeSectionChanges(before, after)).toBe(
      "Experience: updated Tech Corp",
    );
  });

  it("detects added, removed, and skill changes", () => {
    const before = {
      education: [{ id: "edu-1", universityName: "State University", degree: "BS" }],
      work_experience: [],
      projects: [],
      leadership: [],
      skills: { languages: "Python", developerTools: "Git", technologiesFrameworks: "" },
    };
    const after = {
      education: [],
      work_experience: [{ id: "exp-1", company: "Tech Corp", jobTitle: "Engineer" }],
      projects: [],
      leadership: [],
      skills: { languages: "Python, TypeScript", developerTools: "Git", technologiesFrameworks: "" },
    };

    const summary = summarizeSectionChanges(before, after);
    expect(summary).toContain("Education: removed State University");
    expect(summary).toContain("Experience: added Tech Corp");
    expect(summary).toContain("Skills: updated languages");
  });

  it("returns no changes when content is identical", () => {
    const content = {
      education: [{ id: "edu-1", universityName: "State University" }],
      work_experience: [],
      projects: [],
      leadership: [],
      skills: { languages: "", developerTools: "", technologiesFrameworks: "" },
    };

    expect(summarizeSectionChanges(content, content)).toBe("No section changes detected");
  });
});
