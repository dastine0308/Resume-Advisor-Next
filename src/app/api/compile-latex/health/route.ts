import { NextRequest, NextResponse } from "next/server";

const LATEX_SERVICE_URL =
  process.env.LATEX_SERVICE_URL || "http://localhost:3002";

// Request timeout in milliseconds (5 seconds for health check)
const HEALTH_CHECK_TIMEOUT = 5000;

/**
 * Health check endpoint for LaTeX service
 * GET /api/compile-latex/health
 * Returns: Service health status
 */
export async function GET(request: NextRequest) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_TIMEOUT,
    );

    const healthResponse = await fetch(`${LATEX_SERVICE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!healthResponse.ok) {
      return NextResponse.json(
        {
          status: "unhealthy",
          service: "latex-pdf-service",
          message: "LaTeX service is unavailable",
        },
        { status: 503 },
      );
    }

    const healthData = await healthResponse.json().catch(() => ({}));

    return NextResponse.json({
      status: "healthy",
      service: "latex-pdf-service",
      latexService: healthData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[LaTeX API] Health check failed:", error);

    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          status: "unhealthy",
          service: "latex-pdf-service",
          message: "Health check timed out",
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        status: "unhealthy",
        service: "latex-pdf-service",
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to LaTeX service",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
