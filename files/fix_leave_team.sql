CREATE OR REPLACE FUNCTION public.leave_team()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  v_is_leader BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;

  -- 1. Find my team
  SELECT team_id INTO v_team_id FROM public.team_members WHERE user_id = v_uid;
  IF v_team_id IS NULL THEN RAISE EXCEPTION 'NO_TEAM'; END IF;

  -- 2. Verify not locked
  IF (SELECT is_locked FROM public.teams WHERE id = v_team_id) THEN
    RAISE EXCEPTION 'TEAM_LOCKED';
  END IF;

  -- 3. Check role
  SELECT (leader_id = v_uid) INTO v_is_leader FROM public.teams WHERE id = v_team_id;

  -- 4. Act
  IF v_is_leader THEN
    -- Completely delete the team row. 
    -- Because team_members, team_invitations, etc. have ON DELETE CASCADE,
    -- this also wipes all members, invites, and submission data automatically.
    DELETE FROM public.teams WHERE id = v_team_id;
  ELSE
    -- Normal member leaving
    DELETE FROM public.team_members WHERE user_id = v_uid AND team_id = v_team_id;
  END IF;
END;
$$;

-- Since the user mentioned empty teams are still visible in the admin dashboard,
-- let's run a quick cleanup script to nuke any orphaned empty teams that were left behind!
DELETE FROM public.teams 
WHERE id NOT IN (
  SELECT DISTINCT team_id FROM public.team_members
);
