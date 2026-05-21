import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  activateProSubscription,
  deactivateProSubscription,
  isActiveSubscription,
  isPastDueSubscription,
  maintainPastDuePro,
  resolveUserIdFromStripe,
  shouldDeactivateSubscription,
  subscriptionPeriodEnd,
} from "@/lib/stripe-billing";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

async function syncSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = await resolveUserIdFromStripe({
    metadataUserId: subscription.metadata.supabase_user_id,
    customerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
  });

  if (!userId) {
    throw new Error(
      `Stripe webhook: no user for subscription ${subscription.id}`,
    );
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const periodEnd = subscriptionPeriodEnd(subscription);

  if (isActiveSubscription(subscription)) {
    const { error } = await activateProSubscription({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      periodEnd,
    });
    if (error) throw new Error(`activateProSubscription: ${error}`);
    return;
  }

  if (isPastDueSubscription(subscription)) {
    const { error } = await maintainPastDuePro({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      periodEnd,
    });
    if (error) throw new Error(`maintainPastDuePro: ${error}`);
    return;
  }

  if (shouldDeactivateSubscription(subscription)) {
    const { error } = await deactivateProSubscription(userId);
    if (error) throw new Error(`deactivateProSubscription: ${error}`);
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.mode !== "subscription") return;

  const userId = await resolveUserIdFromStripe({
    metadataUserId: session.metadata?.supabase_user_id,
    clientReferenceId: session.client_reference_id,
    customerId:
      typeof session.customer === "string" ? session.customer : null,
  });

  if (!userId || !session.subscription) return;

  const stripe = getStripe();
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  if (!isActiveSubscription(subscription)) return;

  const { error } = await activateProSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    periodEnd: subscriptionPeriodEnd(subscription),
    resetCredits: true,
  });
  if (error) throw new Error(`checkout activateProSubscription: ${error}`);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Stripe webhook signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
