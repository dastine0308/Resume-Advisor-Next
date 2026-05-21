import { describe, it, expect } from "vitest";
import { parseLatexToData, unescapeLatex, latexToPlainText } from "../latex-parser";
import { generateLatexFromData } from "../latex-generator";
import type { ResumeData } from "@/types/resume";

const sampleData: ResumeData = {
  personalInfo: {
    name: "John Doe",
    email: "john@example.com",
    phone: "123-456-7890",
    linkedin: "https://linkedin.com/in/johndoe",
    github: "https://github.com/johndoe",
  },
  education: [
    {
      id: "edu-1",
      universityName: "State University",
      degree: "Bachelor of Science in Computer Science",
      location: "City, State",
      datesAttended: "Sep. 2017 – May 2021",
      coursework: "Data Structures, Algorithms, Database Management",
      order: 0,
    },
  ],
  experience: [
    {
      id: "exp-1",
      jobTitle: "Software Engineer",
      company: "Tech Corp",
      location: "San Francisco, CA",
      dates: "Jun 2021 – Present",
      description: "- Developed REST APIs\n- Improved performance by 30%",
      order: 0,
    },
  ],
  projects: [
    {
      id: "proj-1",
      projectName: "Resume Builder",
      technologies: "React, TypeScript, Next.js",
      date: "January 2023",
      description: "- Built a resume builder app\n- Used server-side rendering",
      order: 0,
    },
  ],
  leadership: [
    {
      id: "lead-1",
      role: "President",
      organization: "Computer Science Club",
      dates: "2020 – 2021",
      description: "- Organized weekly meetings\n- Grew membership by 50%",
      order: 0,
    },
  ],
  technicalSkills: {
    languages: "Python, Java, TypeScript",
    developerTools: "Git, Docker, VS Code",
    technologiesFrameworks: "React, Next.js, Node.js",
  },
};

// ─── unescapeLatex ────────────────────────────────────────────────────────────

describe("unescapeLatex", () => {
  it("returns empty string unchanged", () => {
    expect(unescapeLatex("")).toBe("");
  });

  it("leaves plain text unchanged", () => {
    expect(unescapeLatex("Hello World")).toBe("Hello World");
  });

  it("unescapes basic special chars", () => {
    expect(unescapeLatex("\\#")).toBe("#");
    expect(unescapeLatex("\\$")).toBe("$");
    expect(unescapeLatex("\\%")).toBe("%");
    expect(unescapeLatex("\\&")).toBe("&");
    expect(unescapeLatex("\\_")).toBe("_");
    expect(unescapeLatex("\\{")).toBe("{");
    expect(unescapeLatex("\\}")).toBe("}");
  });

  it("unescapes special command sequences", () => {
    expect(unescapeLatex("\\textbackslash{}")).toBe("\\");
    expect(unescapeLatex("\\textasciitilde{}")).toBe("~");
    expect(unescapeLatex("\\textasciicircum{}")).toBe("^");
  });

  it("unescapes multiple special chars in one string", () => {
    expect(unescapeLatex("John \\& Jane")).toBe("John & Jane");
    expect(unescapeLatex("score\\%")).toBe("score%");
    expect(unescapeLatex("file\\_name")).toBe("file_name");
  });
});

// ─── latexToPlainText ─────────────────────────────────────────────────────────

describe("latexToPlainText", () => {
  it("strips \\textbf{} while keeping inner text", () => {
    expect(
      latexToPlainText(
        "Applied \\textbf{sentence transformers} to embed video analysis text",
      ),
    ).toBe("Applied sentence transformers to embed video analysis text");
  });

  it("strips nested \\textbf and \\emph", () => {
    expect(latexToPlainText("\\textbf{\\emph{Chroma DB}}")).toBe("Chroma DB");
  });

  it("strips \\emph{}", () => {
    expect(latexToPlainText("Built with \\emph{React}")).toBe("Built with React");
  });
});

// ─── parseLatexToData – personalInfo ─────────────────────────────────────────

describe("parseLatexToData – personalInfo", () => {
  it("parses name", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.personalInfo.name).toBe("John Doe");
  });

  it("parses email", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.personalInfo.email).toBe("john@example.com");
  });

  it("parses phone", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.personalInfo.phone).toBe("123-456-7890");
  });

  it("parses linkedin URL", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.personalInfo.linkedin).toBe(
      "https://linkedin.com/in/johndoe",
    );
  });

  it("parses github URL", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.personalInfo.github).toBe("https://github.com/johndoe");
  });

  it("handles name with special chars (roundtrip)", () => {
    const data: ResumeData = {
      ...sampleData,
      personalInfo: {
        name: "John & Jane",
        email: "john_jane@example.com",
      },
    };
    const latex = generateLatexFromData(data, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.personalInfo.name).toBe("John & Jane");
    expect(parsed.personalInfo.email).toBe("john_jane@example.com");
  });
});

// ─── parseLatexToData – education ────────────────────────────────────────────

describe("parseLatexToData – education", () => {
  it("parses a single education entry", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.education).toHaveLength(1);
  });

  it("parses universityName", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.education[0].universityName).toBe("State University");
  });

  it("parses degree", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.education[0].degree).toBe(
      "Bachelor of Science in Computer Science",
    );
  });

  it("parses location", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.education[0].location).toBe("City, State");
  });

  it("parses datesAttended", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.education[0].datesAttended).toBe("Sep. 2017 – May 2021");
  });

  it("parses coursework back into first education entry", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.education[0].coursework).toContain("Data Structures");
    expect(parsed.education[0].coursework).toContain("Algorithms");
  });

  it("handles multiple education entries", () => {
    const data: ResumeData = {
      ...sampleData,
      education: [
        {
          id: "edu-1",
          universityName: "University A",
          degree: "BSc Computer Science",
          location: "City A",
          datesAttended: "2017 – 2021",
          order: 0,
        },
        {
          id: "edu-2",
          universityName: "University B",
          degree: "MSc Software Engineering",
          location: "City B",
          datesAttended: "2021 – 2023",
          order: 1,
        },
      ],
    };
    const latex = generateLatexFromData(data, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.education).toHaveLength(2);
    expect(parsed.education[0].universityName).toBe("University A");
    expect(parsed.education[1].universityName).toBe("University B");
  });

  it("returns empty array when no education section", () => {
    const data: ResumeData = {
      ...sampleData,
      education: [],
    };
    const latex = generateLatexFromData(data, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.education).toHaveLength(0);
  });
});

// ─── parseLatexToData – experience ───────────────────────────────────────────

describe("parseLatexToData – experience", () => {
  it("parses a single experience entry", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.experience).toHaveLength(1);
  });

  it("parses company", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.experience[0].company).toBe("Tech Corp");
  });

  it("parses jobTitle", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.experience[0].jobTitle).toBe("Software Engineer");
  });

  it("parses dates", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.experience[0].dates).toBe("Jun 2021 – Present");
  });

  it("parses location", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.experience[0].location).toBe("San Francisco, CA");
  });

  it("parses description bullets", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.experience[0].description).toContain("Developed REST APIs");
    expect(parsed.experience[0].description).toContain(
      "Improved performance by 30%",
    );
  });

  it("parses multiple experience entries in order", () => {
    const data: ResumeData = {
      ...sampleData,
      experience: [
        {
          id: "exp-1",
          jobTitle: "Senior Engineer",
          company: "Company A",
          location: "NYC",
          dates: "2022 – Present",
          description: "- Led team",
          order: 0,
        },
        {
          id: "exp-2",
          jobTitle: "Junior Engineer",
          company: "Company B",
          location: "LA",
          dates: "2020 – 2022",
          description: "- Built features",
          order: 1,
        },
      ],
    };
    const latex = generateLatexFromData(data, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience[0].company).toBe("Company A");
    expect(parsed.experience[1].company).toBe("Company B");
  });

  it("returns empty array when no experience section", () => {
    const data: ResumeData = { ...sampleData, experience: [] };
    const latex = generateLatexFromData(data, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.experience).toHaveLength(0);
  });

  it("parses experience when section is titled Work Experience", () => {
    const latex = generateLatexFromData(sampleData, true).replace(
      "\\section{Experience}",
      "\\section{Work Experience}",
    );
    const parsed = parseLatexToData(latex);
    expect(parsed.experience).toHaveLength(1);
    expect(parsed.experience[0].company).toBe("Tech Corp");
  });

  it("parses title-first resumeSubheading (common Jake variant)", () => {
    const latex = `
\\section{Work Experience}
\\resumeSubHeadingListStart
\\resumeSubheading
  {Software Engineer}{Aug 2024 -- Oct 2025}
  {Blobfish AI $|$ React.js, PostgreSQL}{Calgary, AB, Canada}
\\resumeSubHeadingListEnd
`;
    const parsed = parseLatexToData(latex);
    expect(parsed.experience).toHaveLength(1);
    expect(parsed.experience[0].jobTitle).toBe("Software Engineer");
    expect(parsed.experience[0].company).toBe("Blobfish AI");
    expect(parsed.experience[0].dates).toContain("2024");
    expect(parsed.experience[0].location).toBe("Calgary, AB, Canada");
  });

  it("parses company-first resumeSubheading (generator format)", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.experience[0].company).toBe("Tech Corp");
    expect(parsed.experience[0].jobTitle).toBe("Software Engineer");
  });

  it("strips \\textbf from description bullets on roundtrip", () => {
    const data: ResumeData = {
      ...sampleData,
      projects: [
        {
          ...sampleData.projects[0],
          description:
            "- Applied \\textbf{sentence transformers} to embed text in \\textbf{Chroma DB}",
        },
      ],
    };
    const latex =
      generateLatexFromData(data, true) +
      "\n% manual edit simulating user LaTeX\n";
    const withTextbf = latex.replace(
      "Applied sentence transformers",
      "Applied \\textbf{sentence transformers}",
    );
    const parsed = parseLatexToData(withTextbf);
    expect(parsed.projects[0].description).toContain("sentence transformers");
    expect(parsed.projects[0].description).not.toContain("\\textbf");
  });
});

// ─── parseLatexToData – projects ─────────────────────────────────────────────

describe("parseLatexToData – projects", () => {
  it("parses a single project entry", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.projects).toHaveLength(1);
  });

  it("parses projectName", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.projects[0].projectName).toBe("Resume Builder");
  });

  it("parses technologies", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.projects[0].technologies).toBe("React, TypeScript, Next.js");
  });

  it("parses date", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.projects[0].date).toBe("January 2023");
  });

  it("parses description bullets", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.projects[0].description).toContain(
      "Built a resume builder app",
    );
    expect(parsed.projects[0].description).toContain(
      "Used server-side rendering",
    );
  });

  it("parses multiple projects in order", () => {
    const data: ResumeData = {
      ...sampleData,
      projects: [
        {
          id: "p1",
          projectName: "Project Alpha",
          technologies: "Python",
          date: "2022",
          description: "- Alpha feature",
          order: 0,
        },
        {
          id: "p2",
          projectName: "Project Beta",
          technologies: "Go",
          date: "2023",
          description: "- Beta feature",
          order: 1,
        },
      ],
    };
    const latex = generateLatexFromData(data, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.projects).toHaveLength(2);
    expect(parsed.projects[0].projectName).toBe("Project Alpha");
    expect(parsed.projects[1].projectName).toBe("Project Beta");
  });

  it("returns empty array when no projects section", () => {
    const data: ResumeData = { ...sampleData, projects: [] };
    const latex = generateLatexFromData(data, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.projects).toHaveLength(0);
  });
});

// ─── parseLatexToData – technicalSkills ──────────────────────────────────────

describe("parseLatexToData – technicalSkills", () => {
  it("parses languages", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.technicalSkills.languages).toBe("Python, Java, TypeScript");
  });

  it("parses developerTools", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.technicalSkills.developerTools).toBe(
      "Git, Docker, VS Code",
    );
  });

  it("parses technologiesFrameworks", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.technicalSkills.technologiesFrameworks).toBe(
      "React, Next.js, Node.js",
    );
  });

  it("parses custom skill category labels by keyword", () => {
    const latex = `
\\section{Technical Skills}
\\textbf{Programming Languages}{: Python, JavaScript} \\\\
\\textbf{Frameworks \\& Tools}{: React.js, Docker, Git} \\\\
`;
    const parsed = parseLatexToData(latex);
    expect(parsed.technicalSkills.languages).toContain("Python");
    expect(parsed.technicalSkills.technologiesFrameworks).toContain("React");
  });

  it("returns empty strings when skills section is absent", () => {
    const data: ResumeData = {
      ...sampleData,
      technicalSkills: {
        languages: "",
        developerTools: "",
        technologiesFrameworks: "",
      },
    };
    const latex = generateLatexFromData(data, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.technicalSkills.languages).toBe("");
    expect(parsed.technicalSkills.developerTools).toBe("");
    expect(parsed.technicalSkills.technologiesFrameworks).toBe("");
  });
});

// ─── parseLatexToData – leadership ───────────────────────────────────────────

describe("parseLatexToData – leadership", () => {
  it("parses a single leadership entry", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.leadership).toHaveLength(1);
  });

  it("parses role", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.leadership[0].role).toBe("President");
  });

  it("parses organization", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.leadership[0].organization).toBe("Computer Science Club");
  });

  it("parses dates", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.leadership[0].dates).toBe("2020 – 2021");
  });

  it("parses description bullets", () => {
    const latex = generateLatexFromData(sampleData, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.leadership[0].description).toContain(
      "Organized weekly meetings",
    );
    expect(parsed.leadership[0].description).toContain(
      "Grew membership by 50%",
    );
  });

  it("parses Clubs and Extracurriculars section into leadership", () => {
    const latex = `
\\section{Clubs and Extracurriculars}
\\resumeSubHeadingListStart
\\resumeSubheading{Solar Car Team}{Oct 2025 -- Present}
  {Telemetry Member}{Calgary, AB}
\\resumeSubHeadingListEnd
`;
    const parsed = parseLatexToData(latex);
    expect(parsed.leadership).toHaveLength(1);
    expect(parsed.leadership[0].organization).toBe("Solar Car Team");
    expect(parsed.leadership[0].role).toBe("Telemetry Member");
  });

  it("returns empty array when no leadership section", () => {
    const data: ResumeData = { ...sampleData, leadership: [] };
    const latex = generateLatexFromData(data, true);
    const parsed = parseLatexToData(latex);
    expect(parsed.leadership).toHaveLength(0);
  });
});

// ─── parseLatexToData – full empty document ───────────────────────────────────

describe("parseLatexToData – empty document", () => {
  it("handles completely empty resume without throwing", () => {
    const emptyData: ResumeData = {
      personalInfo: { name: "Test User" },
      education: [],
      experience: [],
      projects: [],
      leadership: [],
      technicalSkills: {
        languages: "",
        developerTools: "",
        technologiesFrameworks: "",
      },
    };
    const latex = generateLatexFromData(emptyData, true);
    expect(() => parseLatexToData(latex)).not.toThrow();
    const parsed = parseLatexToData(latex);
    expect(parsed.education).toHaveLength(0);
    expect(parsed.experience).toHaveLength(0);
    expect(parsed.projects).toHaveLength(0);
    expect(parsed.leadership).toHaveLength(0);
  });
});
