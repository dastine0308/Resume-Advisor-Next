"use client";

import { useRouter } from "next/navigation";
import { useKeywordsStore } from "@/stores";

export const useKeywordsSelection = () => {
  const router = useRouter();

  // Use Zustand store instead of local state
  const keywordsData = useKeywordsStore((state) => state.keywordsData);
  const selectedKeywords = useKeywordsStore((state) => state.selectedKeywords);
  const toggleKeyword = useKeywordsStore((state) => state.toggleKeyword);

  const handleNext = () => {
    console.log("Selected keywords:", selectedKeywords);
    router.push("/content-builder");
  };

  const handleBack = () => {
    router.push("/job-description");
  };

  return {
    keywordsData,
    selectedKeywords,
    toggleKeyword,
    handleNext,
    handleBack,
  };
};
