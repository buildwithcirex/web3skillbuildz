-- Renames the team. Only the leader can rename it, and only if not locked.
CREATE OR REPLACE FUNCTION public.rename_team(p_new_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  v_clean_name TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  
  v_clean_name := NULLIF(TRIM(p_new_name), '');
  IF v_clean_name IS NULL THEN RAISE EXCEPTION 'INVALID_NAME'; END IF;

  SELECT team_id INTO v_team_id FROM public.team_members WHERE user_id = v_uid;
  IF v_team_id IS NULL THEN RAISE EXCEPTION 'NO_TEAM'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = v_team_id AND leader_id = v_uid) THEN
    RAISE EXCEPTION 'NOT_LEADER';
  END IF;

  IF (SELECT is_locked FROM public.teams WHERE id = v_team_id) THEN
    RAISE EXCEPTION 'TEAM_LOCKED';
  END IF;

  UPDATE public.teams SET name = v_clean_name WHERE id = v_team_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.rename_team(TEXT) TO authenticated;
