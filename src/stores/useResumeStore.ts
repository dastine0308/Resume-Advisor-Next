import { create } from "zustand";
import type { ResumeData } from "@/types/resume";

interface ResumeStore {
  resumeId: string;
  setResumeId: (id: string) => void;

  resumeData: ResumeData;
  setResumeData: (d: ResumeData | ((prev: ResumeData) => ResumeData)) => void;

  currentStep: number;
  setCurrentStep: (step: number) => void;
  latex: string;
  setLatex: (s: string) => void;

  mode: "form" | "latex";
  setMode: (m: "form" | "latex") => void;

  loading: boolean;
  setLoading: (v: boolean) => void;

  pdfPreviewURL: string | null;
  setPdfPreviewURL: (u: string | null) => void;

  compileError: string | null;
  setCompileError: (e: string | null) => void;

  isPdfGenerating: boolean;
  setIsPdfGenerating: (v: boolean) => void;

  // Reset the store to initial state
  resetStore: () => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resumeId: "",
  setResumeId: (id) => set({ resumeId: id }),

  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

  resumeData: {
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      linkedin: "",
      github: "",
    },
    education: [
      {
        id: "",
        universityName: "",
        degree: "",
        location: "",
        datesAttended: "",
        coursework: "",
        order: 0,
        isCollapsed: false,
      },
    ],
    experience: [
      {
        id: "",
        jobTitle: "",
        company: "",
        location: "",
        dates: "",
        description: "",
        order: 0,
        isCollapsed: false,
      },
    ],
    projects: [
      {
        id: "",
        projectName: "",
        technologies: "",
        date: "",
        description: "",
        order: 0,
        isCollapsed: false,
      },
    ],
    leadership: [
      {
        id: "",
        role: "",
        organization: "",
        dates: "",
        description: "",
        order: 0,
        isCollapsed: false,
      },
    ],
    technicalSkills: {
      languages: "",
      developerTools: "",
      technologiesFrameworks: "",
    },
  },

  setResumeData: (d) =>
    set((state) => ({
      resumeData:
        typeof d === "function"
          ? (d as (p: ResumeData) => ResumeData)(state.resumeData)
          : d,
    })),

  latex: "",
  setLatex: (s) => set({ latex: s }),

  mode: "form",
  setMode: (m) => set({ mode: m }),

  loading: false,
  setLoading: (v) => set({ loading: v }),

  pdfPreviewURL: null,
  setPdfPreviewURL: (u) => set({ pdfPreviewURL: u }),

  compileError: null,
  setCompileError: (e) => set({ compileError: e }),

  isPdfGenerating: false,
  setIsPdfGenerating: (v) => set({ isPdfGenerating: v }),
  resetStore: () =>
    set({
      resumeId: "",
      resumeData: {
        personalInfo: {
          name: "",
          email: "",
          phone: "",
          linkedin: "",
          github: "",
        },
        education: [
          {
            id: "",
            universityName: "",
            degree: "",
            location: "",
            datesAttended: "",
            coursework: "",
            order: 0,
            isCollapsed: false,
          },
        ],
        experience: [
          {
            id: "",
            jobTitle: "",
            company: "",
            location: "",
            dates: "",
            description: "",
            order: 0,
            isCollapsed: false,
          },
        ],
        projects: [
          {
            id: "",
            projectName: "",
            technologies: "",
            date: "",
            description: "",
            order: 0,
            isCollapsed: false,
          },
        ],
        leadership: [
          {
            id: "",
            role: "",
            organization: "",
            dates: "",
            description: "",
            order: 0,
            isCollapsed: false,
          },
        ],
        technicalSkills: {
          languages: "",
          developerTools: "",
          technologiesFrameworks: "",
        },
      },
      currentStep: 1,
      latex: "",
      mode: "form",
      loading: false,
      pdfPreviewURL: null,
      compileError: null,
      isPdfGenerating: false,
    }),
}));

export default useResumeStore;

// Selector hooks: keep components subscribed only to the slice they need
// This reduces re-renders when unrelated parts of the store change.
// Use these in components to read only the required data instead of
// subscribing to the entire store object.
export const useEducation = () => useResumeStore((s) => s.resumeData.education);

export const useExperience = () =>
  useResumeStore((s) => s.resumeData.experience);

export const useProjects = () => useResumeStore((s) => s.resumeData.projects);

export const useLeadership = () =>
  useResumeStore((s) => s.resumeData.leadership);

export const useSetResumeData = () => useResumeStore((s) => s.setResumeData);
