export const AI_CREDIT_COSTS = {
  analyze_job: 1,
  enrich: 1,
  cover_letter: 2,
} as const;

export type AiAction = keyof typeof AI_CREDIT_COSTS;

export const PLAN_ALLOWANCES = {
  free: 10,
  pro: 300,
} as const;

export type UserPlan = keyof typeof PLAN_ALLOWANCES;

export function parseCreditsErrorFromResponse(
  status: number,
  data: { error?: string; code?: string },
): string | null {
  if (status !== 402 || data.code !== "CREDITS_EXHAUSTED") {
    return null;
  }
  return data.error ?? "AI credits exhausted";
}
