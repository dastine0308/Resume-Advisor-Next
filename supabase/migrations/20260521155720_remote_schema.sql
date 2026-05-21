alter sequence "public"."company_id_seq" owned by "public"."company"."id";

alter sequence "public"."cover_letters_id_seq" owned by "public"."cover_letters"."id";

alter sequence "public"."job_postings_id_seq" owned by "public"."job_postings"."id";

alter sequence "public"."job_requirements_id_seq" owned by "public"."job_requirements"."id";

alter sequence "public"."resumes_id_seq" owned by "public"."resumes"."id";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.consume_ai_credits(p_cost integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_plan text;
  v_period_end timestamptz;
  v_allowance integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_cost IS NULL OR p_cost <= 0 THEN
    RETURN true;
  END IF;

  SELECT ai_credits_balance, plan, credits_period_end
  INTO v_balance, v_plan, v_period_end
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_plan = 'free' AND (v_period_end IS NULL OR v_period_end <= now()) THEN
    v_allowance := 10;
    v_period_end := date_trunc('month', now()) + interval '1 month';
    v_balance := v_allowance;
    PERFORM set_config('app.allow_billing_write', 'true', true);
    UPDATE profiles
    SET ai_credits_balance = v_allowance,
        credits_period_end = v_period_end
    WHERE id = v_user_id;
  END IF;

  IF v_balance < p_cost THEN
    RETURN false;
  END IF;

  PERFORM set_config('app.allow_billing_write', 'true', true);
  UPDATE profiles
  SET ai_credits_balance = ai_credits_balance - p_cost
  WHERE id = v_user_id;

  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.credits_allowance_for_plan(p_plan text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case p_plan
    when 'pro' then 300
    else 10          -- free
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_profile_billing_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF current_setting('app.allow_billing_write', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF coalesce(auth.jwt() ->> 'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.plan := OLD.plan;
  NEW.ai_credits_balance := OLD.ai_credits_balance;
  NEW.credits_period_end := OLD.credits_period_end;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  RETURN NEW;
END;
$function$
;


