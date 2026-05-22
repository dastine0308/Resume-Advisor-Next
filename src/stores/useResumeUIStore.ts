import { create } from "zustand";

export type CompileErrorKind = "busy" | "unavailable" | "validation" | "other";

interface ResumeUIStore {
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

  resetUI: () => void;
}

export const useResumeUIStore = create<ResumeUIStore>()((set) => ({
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

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

  resetUI: () =>
    set({
      currentStep: 1,
      latex: "",
      mode: "form",
      loading: false,
      pdfPreviewURL: null,
      compileError: null,
      compileErrorKind: null,
      isPdfGenerating: false,
    }),
}));
