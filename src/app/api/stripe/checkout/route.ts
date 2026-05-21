import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isActiveSubscription } from "@/lib/stripe-billing";
import { getAppUrl, getStripe, getStripeProPriceId } from "@/lib/stripe";

export async function POST() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  try {
    const stripe = getStripe();
    const priceId = getStripeProPriceId();
    const appUrl = getAppUrl();

    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("plan, stripe_customer_id, stripe_subscription_id")
      .eq("id", user!.id)
      .maybeSingle();

    if (profile?.plan === "pro") {
      return NextResponse.json(
        { error: "You already have an active Pro subscription." },
        { status: 400 },
      );
    }

    if (profile?.stripe_subscription_id) {
      try {
        const existing = await stripe.subscriptions.retrieve(
          profile.stripe_subscription_id,
        );
        if (isActiveSubscription(existing)) {
          return NextResponse.json(
            { error: "You already have an active Pro subscription." },
            { status: 400 },
          );
        }
      } catch {
        // Stale subscription id — allow new checkout
      }
    }

    const customerId = profile?.stripe_customer_id as string | undefined;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(customerId
        ? { customer: customerId }
        : { customer_email: user!.email ?? undefined }),
      client_reference_id: user!.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?checkout=success#ai-plan`,
      cancel_url: `${appUrl}/settings?checkout=cancel#ai-plan`,
      metadata: { supabase_user_id: user!.id },
      subscription_data: {
        metadata: { supabase_user_id: user!.id },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Checkout session failed";
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
