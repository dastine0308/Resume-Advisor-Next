import { randomUUID } from "crypto";

export function sampleJobPostingPayload(overrides: Record<string, unknown> = {}) {
  const suffix = randomUUID().slice(0, 8);
  return {
    title: "Software Engineer Intern",
    company_name: `Acme Corp ${suffix}`,
    job_location: "Calgary, AB",
    description: "Build APIs and write tests for a resume advisor product.",
    requirements: ["TypeScript", "React"],
    selected_requirements: ["TypeScript"],
    ...overrides,
  };
}

export function sampleResumeSections() {
  return {
    education: [
      {
        id: "edu-1",
        universityName: "Test University",
        degree: "BSc Computer Science",
        location: "Calgary, AB",
        datesAttended: "2022 – 2026",
        coursework: "Algorithms, Databases",
        order: 0,
        isCollapsed: false,
      },
    ],
    work_experience: [
      {
        id: "exp-1",
        jobTitle: "Developer Intern",
        company: "Acme Corp",
        location: "Calgary, AB",
        dates: "May 2025 – Present",
        description: "- Built integration tests",
        order: 0,
        isCollapsed: false,
      },
    ],
    projects: [],
    leadership: [],
    skills: {
      languages: "TypeScript, Python",
      developerTools: "Git, Docker",
      technologiesFrameworks: "React, Next.js",
    },
  };
}
