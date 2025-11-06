import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Keyword } from "@/types/keywords";

interface KeywordsStore {
  jobId: string;
  keywordsData: Keyword[];
  selectedKeywords: Keyword[];

  // Actions
  setJobId: (id: string) => void;
  setKeywordsData: (data: Keyword[]) => void;
  toggleKeyword: (id: string) => void;
  resetKeywords: () => void;
  updateSelectedKeywords: () => void;
}

export const useKeywordsStore = create<KeywordsStore>()(
  persist(
    (set, get) => ({
      jobId: "",
      keywordsData: [],
      selectedKeywords: [],

      setJobId: (id) => {
        set({ jobId: id });
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
      // 可選：只持久化特定欄位
      // partialize: (state) => ({ selectedKeywords: state.selectedKeywords }),
    },
  ),
);
