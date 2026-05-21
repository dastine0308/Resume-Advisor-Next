import type Stripe from "stripe";
import { PLAN_ALLOWANCES } from "@/lib/ai-credits";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export function subscriptionPeriodEnd(subscription: Stripe.Subscription): Date {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  if (periodEnd) {
    return new Date(periodEnd * 1000);
  }
  const fallback = new Date();
  fallback.setUTCMonth(fallback.getUTCMonth() + 1);
  return fallback;
}

/** True when Stripe's period end is later than what we stored (new billing cycle). */
export function isNewBillingPeriod(
  storedPeriodEndIso: string | null | undefined,
  subscriptionPeriodEndDate: Date,
): boolean {
  if (!storedPeriodEndIso) return true;
  const storedMs = new Date(storedPeriodEndIso).getTime();
  const nextMs = subscriptionPeriodEndDate.getTime();
  if (Number.isNaN(storedMs) || Number.isNaN(nextMs)) return true;
  return nextMs > storedMs;
}

export async function findUserIdByStripeCustomerId(
  customerId: string,
): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.id ?? null;
}

export async function activateProSubscription(params: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  periodEnd: Date;
  /** When true, always set balance to 300. When false, never reset. When omitted, reset only on new billing period. */
  resetCredits?: boolean;
}): Promise<{ error: string | null }> {
  const admin = createSupabaseAdminClient();

  let resetCredits = params.resetCredits;
  if (resetCredits === undefined) {
    const { data: profile } = await admin
      .from("profiles")
      .select("plan, credits_period_end")
      .eq("id", params.userId)
      .maybeSingle();

    resetCredits =
      profile?.plan !== "pro" ||
      isNewBillingPeriod(profile?.credits_period_end, params.periodEnd);
  }

  const updates: Record<string, unknown> = {
    plan: "pro",
    credits_period_end: params.periodEnd.toISOString(),
    stripe_customer_id: params.stripeCustomerId,
    stripe_subscription_id: params.stripeSubscriptionId,
  };

  if (resetCredits) {
    updates.ai_credits_balance = PLAN_ALLOWANCES.pro;
  }

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", params.userId);

  return { error: error?.message ?? null };
}

/** Keep Pro access during Stripe retry window without resetting credits. */
export async function maintainPastDuePro(params: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  periodEnd: Date;
}): Promise<{ error: string | null }> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      plan: "pro",
      credits_period_end: params.periodEnd.toISOString(),
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
    })
    .eq("id", params.userId);

  return { error: error?.message ?? null };
}

export async function deactivateProSubscription(
  userId: string,
): Promise<{ error: string | null }> {
  const admin = createSupabaseAdminClient();
  const periodEnd = new Date();
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  periodEnd.setUTCDate(1);
  periodEnd.setUTCHours(0, 0, 0, 0);

  const { error } = await admin
    .from("profiles")
    .update({
      plan: "free",
      ai_credits_balance: PLAN_ALLOWANCES.free,
      credits_period_end: periodEnd.toISOString(),
      stripe_subscription_id: null,
    })
    .eq("id", userId);

  return { error: error?.message ?? null };
}

export async function resolveUserIdFromStripe(params: {
  metadataUserId?: string | null;
  clientReferenceId?: string | null;
  customerId?: string | null;
}): Promise<string | null> {
  if (params.metadataUserId) return params.metadataUserId;
  if (params.clientReferenceId) return params.clientReferenceId;
  if (params.customerId) {
    return findUserIdByStripeCustomerId(params.customerId);
  }
  return null;
}

export function isActiveSubscription(
  subscription: Stripe.Subscription,
): boolean {
  return subscription.status === "active" || subscription.status === "trialing";
}

export function isPastDueSubscription(
  subscription: Stripe.Subscription,
): boolean {
  return subscription.status === "past_due";
}

/** Terminal states only — past_due keeps Pro during Stripe's payment retry window. */
export function shouldDeactivateSubscription(
  subscription: Stripe.Subscription,
): boolean {
  return (
    subscription.status === "canceled" ||
    subscription.status === "unpaid" ||
    subscription.status === "incomplete_expired" ||
    subscription.status === "paused" ||
    subscription.status === "incomplete"
  );
}
