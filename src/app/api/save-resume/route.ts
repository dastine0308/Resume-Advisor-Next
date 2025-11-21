import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const providedId = body?.resumeId;

    // If client provided an id, echo it back. Otherwise generate a new one.
    const resumeId =
      providedId ||
      `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // TODO: Persist resumeData to DB here (body.resumeData)

    return NextResponse.json({ resumeId }, { status: 200 });
  } catch (err) {
    console.error("Error saving resume:", err);
    return NextResponse.json(
      { error: "Failed to save resume" },
      { status: 500 },
    );
  }
}
