export interface HashedPassword {
  hash: string;
  salt: string;
}

export type UserPlan = "free" | "pro";

export type User = {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  github: string;
  linkedin: string;
  location: string;
  plan?: UserPlan;
  ai_credits_balance?: number;
  credits_period_end?: string | null;
};

export type UserWithPassword = User & {
  password: HashedPassword | null;
};
