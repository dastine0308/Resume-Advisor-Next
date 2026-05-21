-- Tighten RLS on job-related tables, add missing DELETE policies,
-- restrict billing helper functions to service_role, remove duplicate FK.

-- ---------------------------------------------------------------------------
-- Drop overly permissive policies (names from original remote schema)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read" ON public.company;
DROP POLICY IF EXISTS "Public can read job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Public can read job requirements" ON public.job_requirements;
DROP POLICY IF EXISTS "Authenticated users can write" ON public.company;
DROP POLICY IF EXISTS "Authenticated users can write job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Authenticated users can write job requirements" ON public.job_requirements;
DROP POLICY IF EXISTS "Authenticated users can update" ON public.company;
DROP POLICY IF EXISTS "Authenticated users can update job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Authenticated users can update job requirements" ON public.job_requirements;

-- ---------------------------------------------------------------------------
-- company: authenticated users may create rows; update only linked jobs
-- ---------------------------------------------------------------------------
CREATE POLICY "Authenticated users can insert company"
  ON public.company FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read company"
  ON public.company FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update company for own jobs"
  ON public.company FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.company_id = company.id AND jp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.company_id = company.id AND jp.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- job_postings: owner-only access
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can insert own job postings"
  ON public.job_postings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own job postings"
  ON public.job_postings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own job postings"
  ON public.job_postings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job postings"
  ON public.job_postings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- job_requirements: access via owning job_posting
-- ---------------------------------------------------------------------------
CREATE POLICY "Users manage requirements for own jobs"
  ON public.job_requirements FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.id = job_requirements.job_id AND jp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.id = job_requirements.job_id AND jp.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Remove duplicate user_id FK (conflicting ON DELETE actions)
-- ---------------------------------------------------------------------------
ALTER TABLE public.job_postings
  DROP CONSTRAINT IF EXISTS job_postings_user_id_fkey;

-- ---------------------------------------------------------------------------
-- Restrict SECURITY DEFINER billing helpers to service_role only
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.upgrade_to_pro(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upgrade_to_pro(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.upgrade_to_pro(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upgrade_to_pro(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.reset_user_credits(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_user_credits(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.reset_user_credits(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_credits(uuid) TO service_role;
