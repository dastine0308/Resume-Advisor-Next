import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("cover_letters")
    .select("id, user_id, job_id, title, content, creation_date, last_updated")
    .eq("id", id)
    .single();

  if (dbError || !data) {
    return NextResponse.json({ success: false, error: "Cover letter not found" }, { status: 404 });
  }
  if (data.user_id !== user!.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { data: existing } = await supabase!
    .from("cover_letters")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: "Cover letter not found" }, { status: 404 });
  }
  if (existing.user_id !== user!.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { error: dbError } = await supabase!.from("cover_letters").delete().eq("id", id);
  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Cover letter deleted successfully" });
}
