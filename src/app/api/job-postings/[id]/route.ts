import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error: authError } = await getAuthUser();
  if (authError) return authError;

  const { data: jp, error } = await supabase!
    .from("job_postings")
    .select(`
      id, title, description, job_location, posted_date, close_date,
      company ( id, name, location, industry, website ),
      job_requirements ( requirement, is_selected )
    `)
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error || !jp) {
    return NextResponse.json({ success: false, error: "Job posting not found" }, { status: 404 });
  }

  const allReqs: { requirement: string; is_selected: boolean }[] = jp.job_requirements ?? [];
  const requirements = allReqs.filter((r) => !r.is_selected).map((r) => r.requirement);
  const selected = allReqs.filter((r) => r.is_selected).map((r) => r.requirement);

  return NextResponse.json({
    success: true,
    data: {
      id: jp.id,
      title: jp.title,
      description: jp.description,
      job_location: jp.job_location,
      posted_date: jp.posted_date,
      close_date: jp.close_date,
      company: jp.company,
      requirements,
      selected_requirements: selected,
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthUser();
  if (error) return error;

  const { error: dbError, count } = await supabase!
    .from("job_postings")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user!.id);

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }
  if (count === 0) {
    return NextResponse.json({ success: false, error: "Not found or unauthorized" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Job posting deleted successfully" });
}
