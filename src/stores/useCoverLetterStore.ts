import { create } from "zustand";
import type {
  CoverLetterContent,
  CreateUpdateCoverLetterRequest,
  CreateUpdateCoverLetterResponse,
} from "@/types/cover-letter";
import { createOrUpdateCoverLetter } from "@/lib/api-services";

interface CoverLetterStore {
  coverLetterId: number | null;
  setCoverLetterId: (id: number | null) => void;

  title: string;
  setTitle: (title: string) => void;

  resumeId: string;
  setResumeId: (id: string) => void;

  jobId: number | null;
  setJobId: (id: number | null) => void;

  prompt: string;
  setPrompt: (prompt: string) => void;

  content: CoverLetterContent;
  setContent: (
    content:
      | CoverLetterContent
      | ((prev: CoverLetterContent) => CoverLetterContent),
  ) => void;

  generatedContent: string;
  setGeneratedContent: (content: string) => void;

  // Save cover letter to API
  isSaving: boolean;
  saveError: string | null;
  saveCoverLetter: () => Promise<CreateUpdateCoverLetterResponse | null>;

  // Reset the store to initial state
  resetStore: () => void;
}

const initialContent: CoverLetterContent = {
  paragraphs: [],
  closing_signature: "",
  company: "",
  descriptive_prompt: "",
  position: "",
  recipient: "",
  resume_id: null,
  tone: "Professional",
};

export const useCoverLetterStore = create<CoverLetterStore>((set, get) => ({
  coverLetterId: null,
  setCoverLetterId: (id) => set({ coverLetterId: id }),

  title: "",
  setTitle: (title) => set({ title }),

  resumeId: "",
  setResumeId: (id) => set({ resumeId: id }),

  jobId: null,
  setJobId: (id) => set({ jobId: id }),

  prompt: "",
  setPrompt: (prompt) => set({ prompt }),

  generatedContent: "",
  setGeneratedContent: (content) => set({ generatedContent: content }),

  content: initialContent,
  setContent: (content) =>
    set((state) => ({
      content:
        typeof content === "function"
          ? (content as (p: CoverLetterContent) => CoverLetterContent)(
              state.content,
            )
          : content,
    })),

  isSaving: false,
  saveError: null,
  saveCoverLetter: async () => {
    const { coverLetterId, title, jobId, content } = get();

    if (jobId === null) {
      set({ saveError: "Job ID is required to save cover letter" });
      return null;
    }

    if (!title || title.trim() === "") {
      set({ saveError: "Title is required to save cover letter" });
      return null;
    }

    if (!content.paragraphs || content.paragraphs.length === 0) {
      set({ saveError: "Content is required to save cover letter" });
      return null;
    }

    const request: CreateUpdateCoverLetterRequest = {
      id: coverLetterId || undefined,
      job_id: jobId,
      title: title,
      content: content,
    };

    set({ isSaving: true, saveError: null });

    try {
      const response = await createOrUpdateCoverLetter(request);
      if (response.success && response.cover_letter_id) {
        set({ coverLetterId: response.cover_letter_id, isSaving: false });
      }
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save cover letter";
      set({ saveError: errorMessage, isSaving: false });
      return null;
    }
  },

  resetStore: () =>
    set({
      coverLetterId: null,
      title: "",
      resumeId: "",
      jobId: null,
      content: initialContent,
      generatedContent: "",
      isSaving: false,
      saveError: null,
    }),
}));

export default useCoverLetterStore;
