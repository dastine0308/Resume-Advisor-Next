import { NextRequest, NextResponse } from "next/server";

const LATEX_SERVICE_URL =
  process.env.LATEX_SERVICE_URL || "http://localhost:3002";

// Request timeout in milliseconds (30 seconds)
const REQUEST_TIMEOUT = 30000;
// Maximum number of retry attempts
const MAX_RETRIES = 2;
// Delay between retries in milliseconds
const RETRY_DELAY = 1000;

/**
 * Fetch with timeout and retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry on network errors or timeouts
    if (
      retries > 0 &&
      error instanceof Error &&
      (error.name === "AbortError" ||
        error.message.includes("fetch failed") ||
        error.message.includes("network"))
    ) {
      console.log(
        `[LaTeX API] Retry attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES}`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }

    throw error;
  }
}

/**
 * Server-side LaTeX compilation API
 * Acts as a gateway between client and LaTeX service
 *
 * POST /api/compile-latex
 * Body: { latex: string }
 * Returns: PDF file
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if LaTeX service is healthy
    console.log("[LaTeX API] Checking LaTeX service health...");
    const healthResponse = await fetchWithRetry(`${LATEX_SERVICE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!healthResponse.ok) {
      console.error("[LaTeX API] LaTeX service is unavailable");
      return NextResponse.json(
        {
          error: "LaTeX service is unavailable",
          message:
            "The LaTeX compilation service is currently offline. Please try again later.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { latex } = body;

    if (!latex) {
      console.error("[LaTeX API] Missing LaTeX content in request");
      return NextResponse.json(
        {
          error: "LaTeX content is required",
          message: "Please provide LaTeX content to compile",
        },
        { status: 400 },
      );
    }

    console.log("[LaTeX API] Starting LaTeX compilation...");
    console.log(`[LaTeX API] LaTeX length: ${latex.length} characters`);

    // Forward request to LaTeX service with retry logic
    const response = await fetchWithRetry(
      `${LATEX_SERVICE_URL}/api/compile-latex`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latex }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[LaTeX API] Compilation failed:", errorData);
      return NextResponse.json(
        {
          error: "LaTeX compilation failed",
          message:
            errorData.message ||
            "Failed to compile LaTeX. Please check your LaTeX syntax.",
        },
        { status: 500 },
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    const duration = Date.now() - startTime;

    console.log(
      `[LaTeX API] PDF generated successfully in ${duration}ms (${pdfBuffer.byteLength} bytes)`,
    );

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
        "Content-Length": pdfBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[LaTeX API] Unexpected error:", error);

    // Handle timeout errors
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          error: "Request timeout",
          message:
            "The LaTeX compilation request timed out. Please try again with a smaller document or check your network connection.",
        },
        { status: 504 },
      );
    }

    // Handle network errors
    if (
      error instanceof Error &&
      (error.message.includes("fetch failed") ||
        error.message.includes("network") ||
        error.message.includes("ECONNREFUSED"))
    ) {
      return NextResponse.json(
        {
          error: "Service unavailable",
          message:
            "Unable to connect to the LaTeX service. Please ensure the service is running and accessible.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
