import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { ResumeData } from "@/types/resume";
import {
  createOrUpdateResume,
  type ResumeCreateUpdateRequest,
  type ResumeCreateUpdateResponse,
} from "@/lib/api-services";
import { useAccountStore } from "@/stores/useAccountStore";

interface ResumeStore {
  resumeId: number | null;
  setResumeId: (id: number | null) => void;

  resumeTitle: string;
  setResumeTitle: (title: string, markDirty?: boolean) => void;

  jobId: number | null;
  setJobId: (id: number | null) => void;

  resumeData: ResumeData;
  setResumeData: (
    d: ResumeData | ((prev: ResumeData) => ResumeData),
    markDirty?: boolean,
  ) => void;

  // Track if user has made modifications (for auto-save)
  isDirty: boolean;
  setIsDirty: (v: boolean) => void;

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
  isCreating: boolean; // Lock to prevent multiple create requests
  saveError: string | null;
  saveResume: () => Promise<ResumeCreateUpdateResponse | null>;

  // Reset the store to initial state
  resetStore: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
  resumeId: null,
  setResumeId: (id) => set({ resumeId: id }),

  resumeTitle: "",
  setResumeTitle: (title, markDirty = true) =>
    set({ resumeTitle: title, ...(markDirty && { isDirty: true }) }),

  jobId: null,
  setJobId: (id) => set({ jobId: id }),

  isDirty: false,
  setIsDirty: (v) => set({ isDirty: v }),

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
        id: uuidv4(),
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
        id: uuidv4(),
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
        id: uuidv4(),
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
        id: uuidv4(),
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

  setResumeData: (d, markDirty = true) =>
    set((state) => ({
      resumeData:
        typeof d === "function"
          ? (d as (p: ResumeData) => ResumeData)(state.resumeData)
          : d,
      ...(markDirty && { isDirty: true }),
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
  isCreating: false,
  saveError: null,
  saveResume: async () => {
    const state = get();
    const {
      resumeId,
      resumeData,
      resumeTitle,
      jobId,
      isSaving,
      isDirty,
      isCreating,
    } = state;

    // Prevent duplicate saves
    if (isSaving) {
      return null;
    }

    // Don't save if there are no changes
    if (!isDirty) {
      return null;
    }

    // If no resumeId exists and we're already creating one, wait for it to complete
    // This prevents multiple POST requests creating duplicate resumes
    // Use explicit null check since resumeId could be 0 (which is falsy but valid)
    if (resumeId === null && isCreating) {
      return null;
    }

    if (jobId === null) {
      set({ saveError: "Job ID is required to save resume" });
      return null;
    }

    // Determine if this is a create or update operation
    // Use explicit null check since resumeId could be 0 (which is falsy but valid)
    const isCreateOperation = resumeId === null;

    // Set flags before making the request
    set({
      isSaving: true,
      saveError: null,
      isDirty: false,
      ...(isCreateOperation && { isCreating: true }),
    });

    const request: ResumeCreateUpdateRequest = {
      id: resumeId ?? undefined,
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

    try {
      const response = await createOrUpdateResume(request);
      console.log("!!!!!!!!Saved resume:", response);
      if (response.success && response.resume_id >= 0) {
        set({
          resumeId: response.resume_id,
          isSaving: false,
          isCreating: false,
        });
      } else {
        set({ isSaving: false, isCreating: false });
      }
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save resume";
      // On error, mark as dirty again so user can retry
      set({
        saveError: errorMessage,
        isSaving: false,
        isCreating: false,
        isDirty: true,
      });
      return null;
    }
  },

  resetStore: () =>
    set({
      resumeId: null,
      resumeTitle: "",
      jobId: null,
      isDirty: false,
      resumeData: {
        personalInfo: {
          ...useAccountStore.getState().user,
          name: `${useAccountStore.getState().user.first_name} ${useAccountStore.getState().user.last_name}`.trim(),
        },
        education: [
          {
            id: uuidv4(),
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
            id: uuidv4(),
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
            id: uuidv4(),
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
            id: uuidv4(),
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
      isCreating: false,
      saveError: null,
    }),
    }),
    {
      name: "resume-storage",
      partialize: (state) => ({
        resumeId: state.resumeId,
        resumeTitle: state.resumeTitle,
        jobId: state.jobId,
        resumeData: state.resumeData,
        currentStep: state.currentStep,
      }),
    },
  ),
);

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
