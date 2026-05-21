import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAppUrl, getStripe } from "@/lib/stripe";

export async function POST() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  try {
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user!.id)
      .maybeSingle();

    const customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe to Pro first." },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/settings#ai-plan`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Billing portal failed";
    console.error("Stripe portal error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
