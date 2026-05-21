"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  AI_CREDIT_COSTS,
  PLAN_ALLOWANCES,
  type AiAction,
} from "@/lib/ai-credits";
import { createStripeCheckout } from "@/lib/api-services";

interface UpgradeProCtaProps {
  action?: AiAction;
  className?: string;
  /** Settings page: show button instead of link */
  variant?: "inline" | "settings";
  /** When false, show a neutral upgrade prompt instead of the exhausted-credits warning */
  creditsExhausted?: boolean;
}

export function UpgradeProCta({
  action,
  className = "",
  variant = "inline",
  creditsExhausted = true,
}: UpgradeProCtaProps) {
  const [loading, setLoading] = useState(false);
  const proCredits = PLAN_ALLOWANCES.pro;
  const cost = action ? AI_CREDIT_COSTS[action] : null;

  const message =
    cost != null
      ? `Not enough AI credits (requires ${cost}). Upgrade to Pro for ${proCredits} credits per month.`
      : creditsExhausted
        ? `You've used all your free AI credits this month. Upgrade to Pro for ${proCredits} credits per month.`
        : `Upgrade to Pro for ${proCredits} AI credits per month.`;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await createStripeCheckout();
      window.location.href = url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start checkout",
      );
      setLoading(false);
    }
  };

  if (variant === "settings") {
    const boxClass = creditsExhausted
      ? "border-amber-200 bg-amber-50"
      : "border-gray-200 bg-white";
    const textClass = creditsExhausted ? "text-amber-900" : "text-gray-700";

    return (
      <div
        className={`rounded-lg border p-4 md:p-5 ${boxClass} ${className}`}
      >
        <p className={`text-sm font-medium ${textClass}`}>{message}</p>
        <Button
          variant="primary"
          className="mt-3"
          disabled={loading}
          onClick={handleUpgrade}
        >
          {loading ? "Redirecting…" : "Upgrade to Pro"}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 ${className}`}
    >
      <p className="text-sm text-amber-900">
        {cost != null ? (
          <>Not enough AI credits (requires {cost}). </>
        ) : (
          <>You&apos;ve used all your free AI credits this month. </>
        )}
        <Link
          href="/settings#ai-plan"
          className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
        >
          Upgrade to Pro
        </Link>{" "}
        for {proCredits} credits per month.
      </p>
    </div>
  );
}
