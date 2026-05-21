import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import {
  getLatexServiceUrl,
  MAX_LATEX_BODY_BYTES,
} from "@/lib/latex-service-url";

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
    // Check if LaTeX service is healthy
    console.log("[LaTeX API] Checking LaTeX service health...");
    const healthResponse = await fetch(`${LATEX_SERVICE_URL}/health`);
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

    // Forward request to LaTeX service
    const response = await fetch(`${LATEX_SERVICE_URL}/api/compile-latex`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ latex }),
    });

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
