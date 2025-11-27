import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Keyword, JobPosting } from "@/types/keywords";

interface KeywordsStore {
  jobId: number;
  jobDescription: string;
  keywordsData: Keyword[];
  selectedKeywords: Keyword[];
  jobPosting: JobPosting | null;

  // Actions
  setJobId: (id: number) => void;
  setJobDescription: (desc: string) => void;
  setKeywordsData: (data: Keyword[]) => void;
  toggleKeyword: (id: string) => void;
  resetKeywords: () => void;
  updateSelectedKeywords: () => void;
  setJobPosting: (data: JobPosting | null) => void;
}

export const useKeywordsStore = create<KeywordsStore>()(
  persist(
    (set, get) => ({
      jobId: 0,
      jobDescription: "",
      keywordsData: [],
      selectedKeywords: [],
      jobPosting: null,

      setJobId: (id) => {
        set({ jobId: id });
      },

      setJobDescription: (desc) => {
        set({ jobDescription: desc });
      },

      setJobPosting: (data) => {
        set({ jobPosting: data });
      },

      setKeywordsData: (data) => {
        set({ keywordsData: data });
        get().updateSelectedKeywords();
      },

      toggleKeyword: (id) => {
        set((state) => {
          const updateKeywords = (keywords: Keyword[]) =>
            keywords.map((keyword) =>
              keyword.id === id
                ? { ...keyword, selected: !keyword.selected }
                : keyword,
            );

          return {
            keywordsData: updateKeywords(state.keywordsData),
          };
        });
        get().updateSelectedKeywords();
      },

      resetKeywords: () => {
        set({
          keywordsData: [],
          selectedKeywords: [],
        });
      },

      updateSelectedKeywords: () => {
        const { keywordsData } = get();
        const selected = keywordsData.filter((k) => k.selected);
        set({ selectedKeywords: selected });
      },
    }),
    {
      name: "keywords-storage", // localStorage key
    },
  ),
);
