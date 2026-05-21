import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const body = await req.json();
  const { first_name, last_name, phone, location, linkedin, github } = body;

  if (!first_name || !last_name) {
    return NextResponse.json(
      { success: false, error: "first_name and last_name are required" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user!.id)
    .maybeSingle();

  const periodEnd = new Date();
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  periodEnd.setUTCDate(1);
  periodEnd.setUTCHours(0, 0, 0, 0);

  const row: Record<string, unknown> = {
    id: user!.id,
    first_name,
    last_name,
    phone: phone ?? null,
    location: location ?? null,
    linkedin: linkedin ?? null,
    github: github ?? null,
  };

  if (!existing) {
    row.plan = "free";
    row.ai_credits_balance = 10;
    row.credits_period_end = periodEnd.toISOString();
  }

  const { error: dbError } = await admin.from("profiles").upsert(row);

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("profiles")
    .select(
      "id, first_name, last_name, phone, location, linkedin, github, plan, ai_credits_balance, credits_period_end",
    )
    .eq("id", user!.id)
    .single();

  if (dbError || !data) {
    // Profile row doesn't exist yet (e.g. new OAuth user who hasn't completed setup),
    // but user is authenticated — return their auth email so the UserMenu can render.
    return NextResponse.json({ success: true, data: { email: user!.email } });
  }

  return NextResponse.json({ success: true, data: { ...data, email: user!.email } });
}

export async function PUT(req: NextRequest) {
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const body = await req.json();
  const allowed = ["first_name", "last_name", "phone", "location", "linkedin", "github"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const { error: dbError } = await supabase!
    .from("profiles")
    .update(updates)
    .eq("id", user!.id);

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Profile updated successfully" });
}

export async function DELETE() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  // Deleting the auth user cascades to profiles and all user data via FK
  const admin = createSupabaseAdminClient();
  const { error: dbError } = await admin.auth.admin.deleteUser(user!.id);
  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Account deleted successfully" });
}
