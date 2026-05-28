import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import {
  getLatexServiceUrl,
  MAX_LATEX_BODY_BYTES,
} from "@/lib/latex-service-url";
import {
  LATEX_HEALTH_TIMEOUT_MS,
  getLatexCompileTimeoutMs,
} from "@/lib/latex-timeouts";

const LATEX_SERVICE_URL = getLatexServiceUrl();

/**
 * Server-side LaTeX compilation API
 * Acts as a gateway between client and LaTeX service
 *
 * POST /api/compile-latex
 * Body: { latex: string }
 * Returns: PDF file
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await getAuthUser();
  if (authError) return authError;

  const startTime = Date.now();

  try {
    console.log("[LaTeX API] Checking LaTeX service readiness...");

    let healthResponse;
    try {
      healthResponse = await fetch(`${LATEX_SERVICE_URL}/health/ready`, {
        signal: AbortSignal.timeout(LATEX_HEALTH_TIMEOUT_MS),
      });
    } catch (healthError) {
      // Network error or timeout on health check
      const isTimeout =
        healthError instanceof Error && healthError.name === "TimeoutError";
      console.error(
        "[LaTeX API] Health check failed:",
        isTimeout ? "timeout" : "network error",
        healthError,
      );
      return NextResponse.json(
        {
          error: isTimeout ? "service_timeout" : "service_unavailable",
          message: isTimeout
            ? "LaTeX service is not responding. Please try again in a moment."
            : "Cannot connect to LaTeX service. Please try again later.",
          retryable: isTimeout,
        },
        { status: isTimeout ? 503 : 502 },
      );
    }

    if (!healthResponse.ok) {
      const isBusy = healthResponse.status === 503;
      console.error(
        "[LaTeX API] LaTeX service health check failed:",
        healthResponse.status,
      );
      return NextResponse.json(
        {
          error: isBusy ? "Service busy" : "LaTeX service is unavailable",
          message: isBusy
            ? "The LaTeX compilation service is busy. Please try again in a moment."
            : "The LaTeX compilation service is currently offline. Please try again later.",
          retryable: isBusy,
        },
        { status: isBusy ? 503 : 502 },
      );
    }

    const body = await request.json();
    const { latex } = body;

    if (typeof latex !== "string") {
      return NextResponse.json(
        {
          error: "LaTeX content is required",
          message: "Please provide LaTeX content to compile",
        },
        { status: 400 },
      );
    }

    if (Buffer.byteLength(latex, "utf8") > MAX_LATEX_BODY_BYTES) {
      return NextResponse.json(
        {
          error: "LaTeX document too large",
          message: "Document exceeds the maximum allowed size.",
        },
        { status: 413 },
      );
    }

    if (!latex.trim()) {
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

    const response = await fetch(`${LATEX_SERVICE_URL}/api/compile-latex`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ latex }),
      signal: AbortSignal.timeout(getLatexCompileTimeoutMs()),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[LaTeX API] Compilation failed:", errorData);

      if (response.status === 503) {
        return NextResponse.json(
          {
            error: errorData.error || "Service busy",
            message:
              errorData.message ||
              "Too many concurrent compilations. Please try again in a moment.",
            retryable: true,
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        {
          error: errorData.error || "LaTeX compilation failed",
          message:
            errorData.message ||
            "Failed to compile LaTeX. Please check your LaTeX syntax.",
        },
        { status: response.status },
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    const duration = Date.now() - startTime;

    console.log(
      `[LaTeX API] PDF generated successfully in ${duration}ms (${pdfBuffer.byteLength} bytes)`,
    );

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

    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        {
          error: "LaTeX service timeout",
          message:
            "Compilation took too long or the service is overloaded. Please try again.",
          retryable: true,
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
