import { describe, it, expect } from "vitest";
import {
  isActiveSubscription,
  isNewBillingPeriod,
  isPastDueSubscription,
  shouldDeactivateSubscription,
} from "../stripe-billing";
import type Stripe from "stripe";

function sub(status: Stripe.Subscription.Status): Stripe.Subscription {
  return { status } as Stripe.Subscription;
}

describe("stripe subscription status helpers", () => {
  it("treats active and trialing as active", () => {
    expect(isActiveSubscription(sub("active"))).toBe(true);
    expect(isActiveSubscription(sub("trialing"))).toBe(true);
  });

  it("does not treat past_due as active", () => {
    expect(isActiveSubscription(sub("past_due"))).toBe(false);
  });

  it("recognizes past_due for grace-period handling", () => {
    expect(isPastDueSubscription(sub("past_due"))).toBe(true);
    expect(isPastDueSubscription(sub("active"))).toBe(false);
  });

  it("does not deactivate on past_due (Stripe retry window)", () => {
    expect(shouldDeactivateSubscription(sub("past_due"))).toBe(false);
  });

  it("deactivates on terminal statuses", () => {
    expect(shouldDeactivateSubscription(sub("paused"))).toBe(true);
    expect(shouldDeactivateSubscription(sub("canceled"))).toBe(true);
    expect(shouldDeactivateSubscription(sub("unpaid"))).toBe(true);
  });

  it("does not deactivate active subscriptions", () => {
    expect(shouldDeactivateSubscription(sub("active"))).toBe(false);
    expect(shouldDeactivateSubscription(sub("trialing"))).toBe(false);
  });
});

describe("isNewBillingPeriod", () => {
  it("returns true when no stored period end", () => {
    expect(isNewBillingPeriod(null, new Date("2026-06-01"))).toBe(true);
  });

  it("returns true when subscription period end advances", () => {
    expect(
      isNewBillingPeriod(
        "2026-05-01T00:00:00.000Z",
        new Date("2026-06-01T00:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("returns false when period end is unchanged", () => {
    const end = new Date("2026-06-01T00:00:00.000Z");
    expect(isNewBillingPeriod(end.toISOString(), end)).toBe(false);
  });
});
