import { create } from "zustand";
import type { ResumeData } from "@/types/resume";
import {
  createOrUpdateResume,
  type ResumeCreateUpdateRequest,
  type ResumeCreateUpdateResponse,
} from "@/lib/api-services";
import { useAccountStore } from "@/stores/useAccountStore";
import { use } from "react";

interface ResumeStore {
  resumeId: string;
  setResumeId: (id: string) => void;

  resumeTitle: string;
  setResumeTitle: (title: string) => void;

  jobId: number | null;
  setJobId: (id: number | null) => void;

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

  // Save resume to API
  isSaving: boolean;
  saveError: string | null;
  saveResume: () => Promise<ResumeCreateUpdateResponse | null>;

  // Reset the store to initial state
  resetStore: () => void;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  resumeId: "",
  setResumeId: (id) => set({ resumeId: id }),

  resumeTitle: "",
  setResumeTitle: (title) => set({ resumeTitle: title }),

  jobId: null,
  setJobId: (id) => set({ jobId: id }),

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

  isSaving: false,
  saveError: null,
  saveResume: async () => {
    const { resumeId, resumeData, resumeTitle, jobId } = get();

    if (jobId === null) {
      set({ saveError: "Job ID is required to save resume" });
      return null;
    }

    const request: ResumeCreateUpdateRequest = {
      id: resumeId || undefined,
      job_id: jobId,
      sections: {
        education: resumeData.education,
        projects: resumeData.projects,
        skills: resumeData.technicalSkills,
        work_experience: resumeData.experience,
        leadership: resumeData.leadership,
      },
      title: resumeTitle || "Untitled Resume",
    };

    set({ isSaving: true, saveError: null });

    try {
      const response = await createOrUpdateResume(request);
      if (response.success && response.resume_id) {
        set({ resumeId: response.resume_id, isSaving: false });
      }
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save resume";
      set({ saveError: errorMessage, isSaving: false });
      return null;
    }
  },

  resetStore: () =>
    set({
      resumeId: "",
      resumeTitle: "",
      jobId: null,
      resumeData: {
        personalInfo: {
          ...useAccountStore.getState().user,
          name: `${useAccountStore.getState().user.first_name} ${useAccountStore.getState().user.last_name}`.trim(),
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
      isSaving: false,
      saveError: null,
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
