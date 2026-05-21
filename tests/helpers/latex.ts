import { generateLatexFromData } from "@/lib/latex-generator";
import type { ResumeData } from "@/types/resume";

export function minimalResumeLatex() {
  const data: ResumeData = {
    personalInfo: {
      name: "Integration Test User",
      email: "test@example.com",
      phone: "555-0100",
      linkedin: "",
      github: "",
      address: "Calgary, AB",
    },
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
  return generateLatexFromData(data, true);
}
