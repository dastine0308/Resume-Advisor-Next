"use client";

import Link from "next/link";
import { PLAN_ALLOWANCES } from "@/lib/ai-credits";
import { useAiCredits } from "@/hooks/useAiCredits";
import type { UserPlan } from "@/types/user";

function formatResetDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CreditsBadge() {
  const { user, isLoading, isCreditsDepleted } = useAiCredits();

  if (isLoading || user?.ai_credits_balance == null) {
    return (
      <div className="hidden h-8 w-24 animate-pulse rounded-full bg-gray-200 md:block" />
    );
  }

  const plan = (user.plan ?? "free") as UserPlan;
  const allowance = PLAN_ALLOWANCES[plan];
  const resetLabel = formatResetDate(user.credits_period_end);
  const planLabel = plan === "pro" ? "Pro" : "Free";

  const badge = (
    <div
      className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:flex ${
        isCreditsDepleted
          ? "cursor-pointer border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100"
          : "border-indigo-100 bg-indigo-50 text-indigo-700"
      }`}
      title={
        isCreditsDepleted
          ? "AI credits depleted · Click to upgrade"
          : resetLabel
            ? `${planLabel} plan · Resets ${resetLabel}`
            : `${planLabel} plan`
      }
    >
      <span className="font-medium">{planLabel}</span>
      <span className={isCreditsDepleted ? "text-amber-400" : "text-indigo-400"}>
        ·
      </span>
      <span>
        {user.ai_credits_balance}/{allowance} AI credits
      </span>
    </div>
  );

  if (isCreditsDepleted) {
    return (
      <Link href="/settings#ai-plan" className="hidden md:block">
        {badge}
      </Link>
    );
  }

  return badge;
}
