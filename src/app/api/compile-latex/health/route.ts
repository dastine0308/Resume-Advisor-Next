import { NextResponse } from "next/server";
import { getLatexServiceUrl } from "@/lib/latex-service-url";
import { LATEX_HEALTH_TIMEOUT_MS } from "@/lib/latex-timeouts";

export async function GET() {
  try {
    const response = await fetch(`${getLatexServiceUrl()}/health/ready`, {
      cache: "no-store",
      signal: AbortSignal.timeout(LATEX_HEALTH_TIMEOUT_MS),
    });

    if (response.status === 503) {
      return NextResponse.json(
        { ok: false, degraded: true, reason: "busy" },
        { status: 503 },
      );
    }

    if (!response.ok) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
