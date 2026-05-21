import { AI_CREDIT_COSTS, type AiAction } from "@/lib/ai-credits";

interface AiCreditHintProps {
  action: AiAction;
  className?: string;
}

function formatCredits(action: AiAction): string {
  const cost = AI_CREDIT_COSTS[action];
  return cost === 1 ? "1 AI credit" : `${cost} AI credits`;
}

/** Credit cost appended inside an AI action button, e.g. "Enrich with AI · 1 AI credit" */
export function AiCreditHint({ action, className = "" }: AiCreditHintProps) {
  const label = formatCredits(action);

  return (
    <span className={`font-normal opacity-80 ${className}`}> · {label}</span>
  );
}
