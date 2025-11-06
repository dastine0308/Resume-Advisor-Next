/**
 * LaTeX compilation client
 * Communicates with the Next.js API route to compile .tex files to PDF
 * The API route then forwards requests to the LaTeX service
 */

/**
 * Check if LaTeX service is healthy (via Next.js API)
 */
export async function checkLatexServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch("/api/compile-latex/health", {
      method: "GET",
      cache: "no-store",
    });
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
export async function compileLaTeXToPDF(latexContent: string): Promise<Blob> {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          errorData.error ||
          `LaTeX compilation failed: ${response.statusText}`,
      );
    }

    console.log("[LaTeX Client] PDF generated successfully");
    return await response.blob();
  } catch (error) {
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
