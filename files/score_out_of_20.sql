-- Switch team scoring from 0-100 to 0-20.
-- Aborts without changing anything if a team already has a score above 20;
-- re-score or clear those teams first.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.teams WHERE score > 20) THEN
    RAISE EXCEPTION 'Some teams already have a score above 20. Update or clear them before running this migration.';
  END IF;
END $$;

ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_score_range;
ALTER TABLE public.teams
  ADD CONSTRAINT teams_score_range CHECK (score IS NULL OR (score BETWEEN 0 AND 20));

CREATE OR REPLACE FUNCTION public.score_team(p_team_id UUID, p_score INTEGER, p_feedback TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  IF p_score IS NOT NULL AND (p_score < 0 OR p_score > 20) THEN RAISE EXCEPTION 'INVALID_SCORE'; END IF;
  UPDATE public.teams
  SET score = p_score, feedback = NULLIF(TRIM(COALESCE(p_feedback, '')), '')
  WHERE id = p_team_id;
END; $$;
