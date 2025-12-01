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
    if (response.ok) {
      isLatexServiceUnavailable = false;
    }
    return response.ok;
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

export async function compileLaTeXToPDF(latexContent: string): Promise<Blob> {
  // If service is already marked as unavailable, throw immediately
  if (isLatexServiceUnavailable) {
    throw new LaTeXServiceUnavailableError();
  }

  try {
    console.log("[LaTeX Client] Sending LaTeX content for compilation...");
    console.log(`[LaTeX Client] Content length: ${latexContent.length} chars`);

    // Use Next.js API route instead of direct service call
    const response = await fetch("/api/compile-latex", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latex: latexContent,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      // Check if it's a service unavailable error (500 or network error)
      if (response.status >= 500) {
        isLatexServiceUnavailable = true;
        throw new LaTeXServiceUnavailableError();
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          errorData.error ||
          `LaTeX compilation failed: ${response.statusText}`,
      );
    }

    // Service is working, ensure it's not marked as unavailable
    isLatexServiceUnavailable = false;
    console.log("[LaTeX Client] PDF generated successfully");
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
