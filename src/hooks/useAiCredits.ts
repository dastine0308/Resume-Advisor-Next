import { AI_CREDIT_COSTS, type AiAction } from "@/lib/ai-credits";
import { useProfile } from "@/hooks/useProfile";
import type { UserPlan } from "@/types/user";

export function useAiCredits() {
  const { data: user, isLoading } = useProfile();
  const balance = user?.ai_credits_balance;
  const plan = (user?.plan ?? "free") as UserPlan;

  const canAfford = (action: AiAction) =>
    balance != null && balance >= AI_CREDIT_COSTS[action];

  const showUpgradeCta = (action: AiAction) =>
    plan === "free" &&
    !isLoading &&
    balance != null &&
    balance < AI_CREDIT_COSTS[action];

  const isCreditsDepleted = plan === "free" && balance === 0;

  return { balance, isLoading, canAfford, showUpgradeCta, isCreditsDepleted, plan, user };
}
