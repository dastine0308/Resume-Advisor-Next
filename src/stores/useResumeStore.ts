import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { ResumeData } from "@/types/resume";
import {
  createOrUpdateResume,
  type ResumeCreateUpdateRequest,
  type ResumeCreateUpdateResponse,
} from "@/lib/api-services";

export type CompileErrorKind = "busy" | "unavailable" | "validation" | "other";

interface ResumeStore {
  resumeId: string | null;
  setResumeId: (id: string | null) => void;

  resumeTitle: string;
  setResumeTitle: (title: string, markDirty?: boolean) => void;

  jobId: string | null;
  setJobId: (id: string | null) => void;

  resumeData: ResumeData;
  setResumeData: (
    d: ResumeData | ((prev: ResumeData) => ResumeData),
    markDirty?: boolean,
  ) => void;

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
  compileErrorKind: CompileErrorKind | null;
  setCompileError: (
    message: string | null,
    kind?: CompileErrorKind | null,
  ) => void;

  isPdfGenerating: boolean;
  setIsPdfGenerating: (v: boolean) => void;

  isSaving: boolean;
  isCreating: boolean; // Lock to prevent multiple create requests
  saveError: string | null;
  saveResume: (options?: {
    force?: boolean;
    versionSource?: "manual" | "autosave";
    versionLabel?: string;
  }) => Promise<ResumeCreateUpdateResponse | null>;

  resetStore: () => void;
}

function makeInitialResumeData(): ResumeData {
  return {
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      linkedin: "",
      github: "",
      address: "",
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
  };
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

  resumeData: makeInitialResumeData(),

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
  compileErrorKind: null,
  setCompileError: (message, kind = null) =>
    set({
      compileError: message,
      compileErrorKind: message ? (kind ?? "other") : null,
    }),

  isPdfGenerating: false,
  setIsPdfGenerating: (v) => set({ isPdfGenerating: v }),

  isSaving: false,
  isCreating: false,
  saveError: null,
  saveResume: async (options) => {
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

    const force = options?.force ?? false;
    const versionSource = options?.versionSource ?? "autosave";
    const versionLabel = options?.versionLabel?.trim();

    if (isSaving) return null;
    if (!force && !isDirty) return null;

    // Use explicit null check since resumeId could be 0 (which is falsy but valid)
    if (resumeId === null && isCreating) return null;

    if (jobId === null) {
      set({ saveError: "Job ID is required to save resume" });
      return null;
    }

    // Use explicit null check since resumeId could be 0 (which is falsy but valid)
    const isCreateOperation = resumeId === null;

    set({
      isSaving: true,
      saveError: null,
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
      version_source: versionSource,
      ...(versionLabel ? { version_label: versionLabel } : {}),
    };

    try {
      const response = await createOrUpdateResume(request);
      if (response.success && response.resume_id) {
        set({
          resumeId: response.resume_id,
          isSaving: false,
          isCreating: false,
          isDirty: false,
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
      resumeData: makeInitialResumeData(),
      currentStep: 1,
      latex: "",
      mode: "form",
      loading: false,
      pdfPreviewURL: null,
      compileError: null,
      compileErrorKind: null,
      isPdfGenerating: false,
      isSaving: false,
      isCreating: false,
      saveError: null,
    }),
    }),
    {
      name: "resume-storage",
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { resumeData?: { education?: { location?: string; datesAttended?: string }[] } };
        if (version === 0 && state.resumeData?.education) {
          // Fix: generator/parser previously had location↔datesAttended swapped for education.
          // Swap the values back so the data matches the correct field semantics.
          state.resumeData.education = state.resumeData.education.map((edu) => ({
            ...edu,
            location: edu.datesAttended ?? "",
            datesAttended: edu.location ?? "",
          }));
        }
        return state;
      },
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

// Selector hooks for fine-grained subscriptions — prevents re-renders when
// unrelated store slices change.
export const useEducation = () => useResumeStore((s) => s.resumeData.education);

export const useExperience = () =>
  useResumeStore((s) => s.resumeData.experience);

export const useProjects = () => useResumeStore((s) => s.resumeData.projects);

export const useLeadership = () =>
  useResumeStore((s) => s.resumeData.leadership);

export const useSetResumeData = () => useResumeStore((s) => s.setResumeData);
