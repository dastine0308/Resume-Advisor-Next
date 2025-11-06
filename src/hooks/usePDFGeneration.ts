/**
 * Custom hook for PDF generation using LaTeX
 * Best practice: Centralized PDF generation logic with error handling and loading states
 */

import { useState, useCallback } from "react";
import { compileLaTeXToPDF } from "@/lib/latex-client";

interface UsePDFGenerationOptions {
  onSuccess?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export function usePDFGeneration(options?: UsePDFGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generatePDF = useCallback(
    async (latexContent: string, filename: string = "resume.pdf") => {
      setIsGenerating(true);
      setError(null);

      try {
        // Use LaTeX client to compile LaTeX content to PDF
        const blob = await compileLaTeXToPDF(latexContent);

        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        options?.onSuccess?.(blob);

        return blob;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    generatePDF,
    isGenerating,
    error,
    reset,
  };
}
