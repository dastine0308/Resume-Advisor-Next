import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JobPosting } from "@/types/job-posting";
import { useResumeStore } from "@/stores";
import {
  createOrUpdateJobPosting,
  createOrUpdateJobPostingResponse,
} from "@/lib/api-services";

interface JobPostingStore {
  jobDescription: string;
  setJobDescription: (data: string, markDirty?: boolean) => void;

  selectedKeywords: string[];
  setSelectedKeywords: (data: string[], markDirty?: boolean) => void;

  jobPosting: JobPosting | null;
  setJobPosting: (data: JobPosting | null, markDirty?: boolean) => void;

  // Track if user has made modifications (for auto-save)
  isDirty: boolean;
  setIsDirty: (v: boolean) => void;

  isAutoSaving: boolean;

  resetStore: () => void;

  saveJobPosting: () => Promise<createOrUpdateJobPostingResponse | null>;
}

export const useJobPostingStore = create<JobPostingStore>()(
  persist(
    (set, get) => ({
      jobDescription: "",
      setJobDescription: (data, markDirty = true) => {
        set({ jobDescription: data, ...(markDirty && { isDirty: true }) });
      },

      selectedKeywords: [],
      jobPosting: null,
      isAutoSaving: false,
      isDirty: false,

      setIsDirty: (v) => set({ isDirty: v }),

      setJobPosting: (data, markDirty = true) => {
        set({ jobPosting: data, ...(markDirty && { isDirty: true }) });
      },

      setSelectedKeywords: (data, markDirty = true) => {
        set({ selectedKeywords: data, ...(markDirty && { isDirty: true }) });
      },

      resetStore: () => {
        set({
          selectedKeywords: [],
          jobPosting: null,
          jobDescription: "",
          isDirty: false,
        });
      },

      saveJobPosting: async () => {
        const { jobPosting, selectedKeywords, jobDescription } = get();

        const payload = {
          job_id: useResumeStore.getState().jobId || undefined,
          title: jobPosting?.title?.trim() || "Untitled Job Posting",
          company_name: jobPosting?.company_name?.trim() || "Unknown Company",
          job_location: jobPosting?.job_location?.trim() || "Unknown Location",
          close_date:
            jobPosting?.close_date || new Date().toISOString().split("T")[0],
          company_industry: jobPosting?.company_industry,
          company_location: jobPosting?.company_location,
          company_website: jobPosting?.company_website,
          description: jobDescription,
          posted_date:
            jobPosting?.posted_date || new Date().toISOString().split("T")[0],
          requirements: jobPosting?.requirements,
          selected_requirements: selectedKeywords,
        };

        set({ isAutoSaving: true });
        try {
          const response = await createOrUpdateJobPosting(payload);
          if (response?.job_id && !useResumeStore.getState().jobId) {
            useResumeStore.getState().setJobId(response.job_id);
          }
          return response;
        } finally {
          set({ isAutoSaving: false });
        }
      },
    }),
    {
      name: "job-posting-storage", // localStorage key
    },
  ),
);
