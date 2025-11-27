export interface Education {
  id: string;
  universityName: string;
  degree: string;
  location: string;
  datesAttended: string;
  coursework?: string;
  order?: number;
  isCollapsed?: boolean;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  dates: string;
  description: string;
  order?: number;
  isCollapsed?: boolean;
}

export interface Project {
  id: string;
  projectName: string;
  technologies: string;
  date: string;
  description: string;
  order?: number;
  isCollapsed?: boolean;
}

export interface Leadership {
  id: string;
  role: string;
  organization: string;
  dates: string;
  description: string;
  order?: number;
  isCollapsed?: boolean;
}

export interface TechnicalSkills {
  languages: string;
  developerTools: string;
  technologiesFrameworks: string;
}

export interface PersonalInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  github?: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  leadership: Leadership[];
  technicalSkills: TechnicalSkills;
}
