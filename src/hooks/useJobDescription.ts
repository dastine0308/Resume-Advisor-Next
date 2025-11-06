import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseJobDescriptionReturn {
  jobDescription: string;
  jobUrl: string;
  isLoading: boolean;
  error: string | null;
  setJobDescription: (value: string) => void;
  setJobUrl: (value: string) => void;
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
  isFormValid: boolean;
}

export const useJobDescription = (): UseJobDescriptionReturn => {
  const router = useRouter();

  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!jobDescription.trim() && !jobUrl.trim()) {
      setError("Please provide either a job description or a URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement API call to enrich with AI
      const response = await fetch("/api/analyze-job-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription,
          jobUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze job description");
      }

      const data = await response.json();
      console.log("Analysis result:", data);

      // TODO: Navigate to next step or handle the response
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      console.error("Error analyzing job description:", err);
    } finally {
      setIsLoading(false);
    }
  }, [jobDescription, jobUrl]);

  const handleCancel = useCallback(() => {
    setJobDescription("");
    setJobUrl("");
    setError(null);
    router.push("/");
  }, []);

  const isFormValid = jobDescription.trim() !== "" || jobUrl.trim() !== "";

  return {
    jobDescription,
    jobUrl,
    isLoading,
    error,
    setJobDescription,
    setJobUrl,
    handleSubmit,
    handleCancel,
    isFormValid,
  };
};
