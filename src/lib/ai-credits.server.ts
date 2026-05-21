import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AI_CREDIT_COSTS,
  type AiAction,
  type UserPlan,
} from "@/lib/ai-credits";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const AI_USAGE_ACTION: Record<AiAction, string> = {
  analyze_job: "analyze_job",
  enrich: "enrich",
  cover_letter: "cover_letter",
};

function creditsExhaustedResponse(plan: UserPlan | null) {
  return NextResponse.json(
    {
      error:
        plan === "pro"
          ? "You've used all your Pro AI credits for this month."
          : "You've used all your free AI credits. Upgrade to Pro for 300 credits per month.",
      code: "CREDITS_EXHAUSTED",
      plan: plan ?? "free",
    },
    { status: 402 },
  );
}

export async function requireAiCredits(
  supabase: SupabaseClient,
  userId: string,
  action: AiAction,
): Promise<{ ok: true; cost: number } | { ok: false; response: NextResponse }> {
  const cost = AI_CREDIT_COSTS[action];

  const { data: consumed, error } = await supabase.rpc("consume_ai_credits", {
    p_cost: cost,
  });

  if (error) {
    return {
      ok: false,
      response: NextResponse.json({ error: error.message }, { status: 500 }),
    };
  }

  if (!consumed) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    const plan = (profile?.plan as UserPlan | undefined) ?? "free";
    return { ok: false, response: creditsExhaustedResponse(plan) };
  }

  return { ok: true, cost };
}

export async function refundAiCredits(
  userId: string,
  cost: number,
): Promise<void> {
  if (cost <= 0) return;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("refund_ai_credits", {
    p_user_id: userId,
    p_cost: cost,
  });

  if (error) {
    console.error("Failed to refund AI credits:", error);
  }
}

export async function logAiUsage(
  userId: string,
  action: AiAction,
  creditsCharged: number,
  tokensUsed?: number,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("ai_usage_logs").insert({
    user_id: userId,
    action: AI_USAGE_ACTION[action],
    credits_charged: creditsCharged,
    tokens_used: tokensUsed ?? null,
  });

  if (error) {
    console.error("Failed to log AI usage:", error);
  }
}
