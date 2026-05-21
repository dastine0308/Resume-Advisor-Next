import { NextResponse } from "next/server";
import { getLatexServiceUrl } from "@/lib/latex-service-url";

export async function GET() {
  try {
    const response = await fetch(`${getLatexServiceUrl()}/health`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
