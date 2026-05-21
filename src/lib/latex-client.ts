/**
 * LaTeX compilation client
 * Communicates with the Next.js API route to compile .tex files to PDF
 * The API route then forwards requests to the LaTeX service
 */

// Re-export validation error for use in components
export { LaTeXValidationError } from "./latex-generator";

// Track if LaTeX service is unavailable to prevent repeated failed requests
let isLatexServiceUnavailable = false;

/**
 * Check if LaTeX service is currently marked as unavailable
 */
export function getLatexServiceUnavailable(): boolean {
  return isLatexServiceUnavailable;
}

/**
 * Reset the LaTeX service unavailable state (e.g., for manual retry)
 */
export function resetLatexServiceState(): void {
  isLatexServiceUnavailable = false;
}

/**
 * Check if LaTeX service is healthy (via Next.js API)
 */
export async function checkLatexServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch("/api/compile-latex/health", {
      method: "GET",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      degraded?: boolean;
    };

    if (response.ok && data.ok) {
      isLatexServiceUnavailable = false;
      return true;
    }

    return false;
  } catch (error) {
    console.error("LaTeX service health check failed:", error);
    return false;
  }
}

/**
 * Compile LaTeX document to PDF
 * @param latexContent - Full LaTeX document content
 * @returns PDF Blob
 */
export class LaTeXServiceUnavailableError extends Error {
  constructor(message = "LaTeX service is unavailable") {
    super(message);
    this.name = "LaTeXServiceUnavailableError";
  }
}

export class LaTeXServiceBusyError extends Error {
  constructor(message = "The LaTeX service is busy. Please try again in a moment.") {
    super(message);
    this.name = "LaTeXServiceBusyError";
  }
}

export async function compileLaTeXToPDF(latexContent: string): Promise<Blob> {
  // If service is already marked as unavailable, throw immediately
  if (isLatexServiceUnavailable) {
    throw new LaTeXServiceUnavailableError();
  }

  try {

    // Use Next.js API route instead of direct service call
    const response = await fetch("/api/compile-latex", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latex: latexContent,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        retryable?: boolean;
      };

      // Transient overload — do not mark the service permanently unavailable
      if (response.status === 503 && errorData.retryable !== false) {
        throw new LaTeXServiceBusyError(
          errorData.message ||
            "The LaTeX service is busy. Please try again in a moment.",
        );
      }

      if (response.status >= 500) {
        isLatexServiceUnavailable = true;
        throw new LaTeXServiceUnavailableError(
          errorData.message || "LaTeX service is unavailable",
        );
      }

      throw new Error(
        errorData.message ||
          errorData.error ||
          `LaTeX compilation failed: ${response.statusText}`,
      );
    }

    isLatexServiceUnavailable = false;
    return await response.blob();
  } catch (error) {
    // Network errors (fetch failed) indicate service is unavailable
    if (
      error instanceof TypeError ||
      (error instanceof Error && error.message.includes("fetch failed"))
    ) {
      isLatexServiceUnavailable = true;
      throw new LaTeXServiceUnavailableError();
    }
    console.error("[LaTeX Client] Error:", error);
    throw error;
  }
}

/**
 * Generate preview URL for LaTeX PDF
 * @param latexContent - LaTeX document content
 * @returns Object URL for PDF preview
 */
export async function generateLaTeXPreviewURL(
  latexContent: string,
): Promise<string> {
  const pdfBlob = await compileLaTeXToPDF(latexContent);
  return URL.createObjectURL(pdfBlob);
}

/**
 * Download LaTeX as PDF
 * @param latexContent - LaTeX document content
 * @param filename - Download filename
 */
export async function downloadLaTeXAsPDF(
  latexContent: string,
  filename = "resume.pdf",
): Promise<void> {
  const pdfBlob = await compileLaTeXToPDF(latexContent);
  const url = URL.createObjectURL(pdfBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
