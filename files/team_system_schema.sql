-- ============================================================================
-- Team Building & Invitation System — schema, triggers, RPCs, RLS
--
-- Run this ONCE in the Supabase SQL editor, after the base schema in
-- database_schema.md already exists (this depends on public.profiles).
-- The script is idempotent (safe to re-run).
--
-- Design notes:
--   * public.profiles RLS only allows a user to read their own row
--     (see security_protocols.md), so every read/write in this file is
--     exposed to the client exclusively through SECURITY DEFINER RPC
--     functions — never via direct table access. There are no INSERT/
--     UPDATE/DELETE policies below on purpose: the tables themselves are
--     read-only to the "authenticated" role except through the RPCs,
--     which is what makes leader-only / one-team-per-user / capacity
--     enforcement a backend guarantee rather than a UI convention.
--   * MAX_TEAM_SIZE and INVITE_COOLDOWN_SECONDS live in team_max_size()
--     and team_invite_cooldown_seconds() below. They are mirrored in
--     src/lib/team/constants.ts for the frontend — keep both in sync.
-- ============================================================================

-- ---------- Configurable constants ----------
CREATE OR REPLACE FUNCTION public.team_max_size()
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$ SELECT 3 $$;

CREATE OR REPLACE FUNCTION public.team_invite_cooldown_seconds()
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$ SELECT 10 $$;

-- ---------- Tables ----------
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UNIQUE(user_id) is the DB-level guarantee that a user belongs to at most
-- one active team: the row is deleted on removal, freeing them up again.
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON public.team_members(team_id);

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT team_invitations_no_self CHECK (sender_id <> recipient_id)
);

-- Blocks duplicate pending invitations for the same sender/recipient pair.
CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_pending_pair_idx
  ON public.team_invitations(sender_id, recipient_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS team_invitations_recipient_idx ON public.team_invitations(recipient_id, status);
CREATE INDEX IF NOT EXISTS team_invitations_sender_pair_idx ON public.team_invitations(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS team_invitations_team_idx ON public.team_invitations(team_id, status);

-- UNIQUE(team_invitation_id) is what prevents duplicate notifications for
-- the same invitation (including under retries/reconnects).
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  team_invitation_id UUID UNIQUE REFERENCES public.team_invitations(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);

-- ---------- Capacity enforcement (handles concurrent accepts) ----------
CREATE OR REPLACE FUNCTION public.enforce_team_capacity() RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
BEGIN
  -- Lock the parent team row so two concurrent inserts for the same team
  -- serialize instead of both reading a stale count.
  PERFORM 1 FROM public.teams WHERE id = NEW.team_id FOR UPDATE;

  SELECT COUNT(*) INTO member_count FROM public.team_members WHERE team_id = NEW.team_id;

  IF member_count >= public.team_max_size() THEN
    RAISE EXCEPTION 'TEAM_FULL';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_members_capacity_trigger ON public.team_members;
CREATE TRIGGER team_members_capacity_trigger
  BEFORE INSERT ON public.team_members
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_team_capacity();

-- ---------- RLS ----------
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helper avoids RLS self-recursion on team_members.
CREATE OR REPLACE FUNCTION public.is_member_of_team(p_team_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Members can view own team" ON public.teams;
CREATE POLICY "Members can view own team" ON public.teams
  FOR SELECT USING (public.is_member_of_team(id));

DROP POLICY IF EXISTS "Members can view own team roster" ON public.team_members;
CREATE POLICY "Members can view own team roster" ON public.team_members
  FOR SELECT USING (public.is_member_of_team(team_id));

DROP POLICY IF EXISTS "Users can view invitations involving them" ON public.team_invitations;
CREATE POLICY "Users can view invitations involving them" ON public.team_invitations
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies are defined: all writes happen through
-- the SECURITY DEFINER functions below, which run with elevated privilege
-- and enforce the business rules regardless of what the client sends.

-- ---------- RPCs ----------

-- Creates a team with the caller as leader. A caller already on a team is rejected.
CREATE OR REPLACE FUNCTION public.create_team(p_name TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  v_name TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'ALREADY_IN_TEAM';
  END IF;

  SELECT COALESCE(NULLIF(TRIM(p_name), ''), name || E'’s Team') INTO v_name
  FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.teams (name, leader_id) VALUES (v_name, v_uid) RETURNING id INTO v_team_id;
  INSERT INTO public.team_members (team_id, user_id, role) VALUES (v_team_id, v_uid, 'leader');

  RETURN v_team_id;
END;
$$;

-- Returns the caller's team (or NULL) with its members and capacity.
CREATE OR REPLACE FUNCTION public.get_my_team()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  result JSON;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT team_id INTO v_team_id FROM public.team_members WHERE user_id = v_uid;

  IF v_team_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', t.id,
    'name', t.name,
    'leaderId', t.leader_id,
    'isLeader', t.leader_id = v_uid,
    'capacity', public.team_max_size(),
    'members', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', p.id,
        'name', p.name,
        'email', p.email,
        'role', m.role,
        'joinedAt', m.joined_at
      ) ORDER BY m.joined_at ASC), '[]'::json)
      FROM public.team_members m
      JOIN public.profiles p ON p.id = m.user_id
      WHERE m.team_id = t.id
    )
  ) INTO result
  FROM public.teams t
  WHERE t.id = v_team_id;

  RETURN result;
END;
$$;

-- Returns pending invitations relevant to the caller: invites they've
-- received, and (if they lead a team) invites their team has sent.
CREATE OR REPLACE FUNCTION public.get_my_invitations()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  v_is_leader BOOLEAN := FALSE;
  incoming JSON;
  outgoing JSON;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT team_id, (role = 'leader') INTO v_team_id, v_is_leader
  FROM public.team_members WHERE user_id = v_uid;

  SELECT COALESCE(json_agg(json_build_object(
    'id', i.id,
    'teamId', i.team_id,
    'teamName', t.name,
    'senderId', i.sender_id,
    'senderName', sp.name,
    'createdAt', i.created_at
  ) ORDER BY i.created_at DESC), '[]'::json) INTO incoming
  FROM public.team_invitations i
  JOIN public.teams t ON t.id = i.team_id
  JOIN public.profiles sp ON sp.id = i.sender_id
  WHERE i.recipient_id = v_uid AND i.status = 'pending';

  IF v_is_leader AND v_team_id IS NOT NULL THEN
    SELECT COALESCE(json_agg(json_build_object(
      'id', i.id,
      'recipientId', i.recipient_id,
      'recipientName', rp.name,
      'createdAt', i.created_at
    ) ORDER BY i.created_at DESC), '[]'::json) INTO outgoing
    FROM public.team_invitations i
    JOIN public.profiles rp ON rp.id = i.recipient_id
    WHERE i.team_id = v_team_id AND i.status = 'pending';
  ELSE
    outgoing := '[]'::json;
  END IF;

  RETURN json_build_object('incoming', incoming, 'outgoing', outgoing);
END;
$$;

-- Searches participants for the "invite to team" UI, with a computed
-- status per row from the caller's perspective.
CREATE OR REPLACE FUNCTION public.search_team_candidates(p_query TEXT)
RETURNS TABLE (id UUID, name TEXT, email TEXT, status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_my_team_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT team_id INTO v_my_team_id FROM public.team_members WHERE user_id = v_uid;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.email,
    CASE
      WHEN tm.team_id IS NOT NULL AND tm.team_id = v_my_team_id THEN 'already_in_team'
      WHEN tm.team_id IS NOT NULL THEN 'already_in_other_team'
      WHEN EXISTS (
        SELECT 1 FROM public.team_invitations pi
        WHERE pi.sender_id = v_uid AND pi.recipient_id = p.id AND pi.status = 'pending'
      ) THEN 'request_sent'
      ELSE 'available'
    END AS status
  FROM public.profiles p
  LEFT JOIN public.team_members tm ON tm.user_id = p.id
  WHERE p.role = 'participant'
    AND p.id <> v_uid
    AND (
      p_query IS NULL OR TRIM(p_query) = '' OR
      p.name ILIKE '%' || p_query || '%' OR
      p.email ILIKE '%' || p_query || '%'
    )
  ORDER BY p.name ASC
  LIMIT 25;
END;
$$;

-- Sends a team invitation, running the full validation chain from the spec.
CREATE OR REPLACE FUNCTION public.send_team_invitation(p_recipient_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  v_role TEXT;
  v_member_count INTEGER;
  v_last_sent TIMESTAMPTZ;
  v_invitation_id UUID;
  v_sender_name TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF p_recipient_id = v_uid THEN
    RAISE EXCEPTION 'CANNOT_INVITE_SELF';
  END IF;

  SELECT team_id, role INTO v_team_id, v_role FROM public.team_members WHERE user_id = v_uid;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'NO_TEAM';
  END IF;

  IF v_role <> 'leader' THEN
    RAISE EXCEPTION 'NOT_LEADER';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id AND role = 'participant') THEN
    RAISE EXCEPTION 'RECIPIENT_NOT_FOUND';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM public.team_members WHERE team_id = v_team_id;
  IF v_member_count >= public.team_max_size() THEN
    RAISE EXCEPTION 'TEAM_FULL';
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = p_recipient_id AND team_id = v_team_id) THEN
    RAISE EXCEPTION 'ALREADY_IN_TEAM';
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = p_recipient_id) THEN
    RAISE EXCEPTION 'ALREADY_IN_OTHER_TEAM';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.team_invitations
    WHERE sender_id = v_uid AND recipient_id = p_recipient_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_PENDING';
  END IF;

  SELECT created_at INTO v_last_sent
  FROM public.team_invitations
  WHERE sender_id = v_uid AND recipient_id = p_recipient_id
  ORDER BY created_at DESC LIMIT 1;

  IF v_last_sent IS NOT NULL
     AND v_last_sent > NOW() - (public.team_invite_cooldown_seconds() || ' seconds')::INTERVAL THEN
    RAISE EXCEPTION 'COOLDOWN_ACTIVE';
  END IF;

  BEGIN
    INSERT INTO public.team_invitations (team_id, sender_id, recipient_id)
    VALUES (v_team_id, v_uid, p_recipient_id)
    RETURNING id INTO v_invitation_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'DUPLICATE_PENDING';
  END;

  SELECT name INTO v_sender_name FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.notifications (user_id, type, team_invitation_id, message)
  VALUES (p_recipient_id, 'team_invitation', v_invitation_id, v_sender_name || ' invited you to join their team.')
  ON CONFLICT (team_invitation_id) DO NOTHING;

  RETURN v_invitation_id;
END;
$$;

-- Accepts a pending invitation atomically; the team-row lock is what keeps
-- two simultaneous accepts from both landing on the last slot.
CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_invitation_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  v_status TEXT;
  v_recipient_id UUID;
  v_member_count INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT team_id, status, recipient_id INTO v_team_id, v_status, v_recipient_id
  FROM public.team_invitations WHERE id = p_invitation_id
  FOR UPDATE;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND';
  END IF;

  IF v_recipient_id <> v_uid THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'INVITATION_NOT_PENDING';
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'ALREADY_IN_TEAM';
  END IF;

  PERFORM 1 FROM public.teams WHERE id = v_team_id FOR UPDATE;

  SELECT COUNT(*) INTO v_member_count FROM public.team_members WHERE team_id = v_team_id;
  IF v_member_count >= public.team_max_size() THEN
    RAISE EXCEPTION 'TEAM_FULL';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role) VALUES (v_team_id, v_uid, 'member');

  UPDATE public.team_invitations SET status = 'accepted', responded_at = NOW() WHERE id = p_invitation_id;
  UPDATE public.notifications SET is_read = TRUE WHERE team_invitation_id = p_invitation_id;
END;
$$;

-- Declines a pending invitation. Team membership is untouched.
CREATE OR REPLACE FUNCTION public.decline_team_invitation(p_invitation_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_status TEXT;
  v_recipient_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT status, recipient_id INTO v_status, v_recipient_id
  FROM public.team_invitations WHERE id = p_invitation_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND';
  END IF;

  IF v_recipient_id <> v_uid THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'INVITATION_NOT_PENDING';
  END IF;

  UPDATE public.team_invitations SET status = 'declined', responded_at = NOW() WHERE id = p_invitation_id;
  UPDATE public.notifications SET is_read = TRUE WHERE team_invitation_id = p_invitation_id;
END;
$$;

-- Leader-only member removal. The removed user's team_members row is
-- deleted, which is what makes them eligible to join another team.
CREATE OR REPLACE FUNCTION public.remove_team_member(p_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_my_team_id UUID;
  v_my_role TEXT;
  v_target_team_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF p_member_id = v_uid THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_SELF';
  END IF;

  SELECT team_id, role INTO v_my_team_id, v_my_role FROM public.team_members WHERE user_id = v_uid;

  IF v_my_team_id IS NULL OR v_my_role <> 'leader' THEN
    RAISE EXCEPTION 'NOT_LEADER';
  END IF;

  SELECT team_id INTO v_target_team_id FROM public.team_members WHERE user_id = p_member_id FOR UPDATE;

  IF v_target_team_id IS NULL OR v_target_team_id <> v_my_team_id THEN
    RAISE EXCEPTION 'NOT_TEAM_MEMBER';
  END IF;

  DELETE FROM public.team_members WHERE user_id = p_member_id AND team_id = v_my_team_id;
END;
$$;

-- ---------- Grants ----------
GRANT EXECUTE ON FUNCTION public.create_team(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_team() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_team_candidates(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_team_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_team_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_team_member(UUID) TO authenticated;

-- ---------- Realtime (for browser notifications) ----------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ============================================================================
-- Phase 2: team-level submission, scoring, and locking
--
-- Moves project submission + scoring off `profiles` (was 1 row per person)
-- onto `teams` (1 row per team). A team must be locked (is_locked = TRUE)
-- before it can submit — locking is a prerequisite gate, not a side effect
-- of submitting — and once locked, membership is frozen (enforced inside
-- send_team_invitation / accept_team_invitation / remove_team_member below).
--
-- Kept consistent with this file's existing design: no direct INSERT/
-- UPDATE/DELETE policies on `teams`/`team_members` — all writes (and, for
-- the new admin/leaderboard views, reads across users) go through
-- SECURITY DEFINER RPCs so lock/capacity/scoring rules stay backend-
-- enforced rather than a client-side convention.
-- ============================================================================

-- ---------- Columns ----------
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS project_description TEXT,
  ADD COLUMN IF NOT EXISTS deploy_link TEXT,
  ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
  ADD COLUMN IF NOT EXISTS score INTEGER,
  ADD COLUMN IF NOT EXISTS feedback TEXT,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teams_score_range'
  ) THEN
    ALTER TABLE public.teams
      ADD CONSTRAINT teams_score_range CHECK (score IS NULL OR (score BETWEEN 0 AND 100));
  END IF;
END $$;

ALTER TABLE public.event_config
  ADD COLUMN IF NOT EXISTS team_formation_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------- Admin helper ----------
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ---------- Membership freeze on locked teams ----------
CREATE OR REPLACE FUNCTION public.send_team_invitation(p_recipient_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  v_role TEXT;
  v_member_count INTEGER;
  v_last_sent TIMESTAMPTZ;
  v_invitation_id UUID;
  v_sender_name TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF p_recipient_id = v_uid THEN
    RAISE EXCEPTION 'CANNOT_INVITE_SELF';
  END IF;

  SELECT team_id, role INTO v_team_id, v_role FROM public.team_members WHERE user_id = v_uid;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'NO_TEAM';
  END IF;

  IF v_role <> 'leader' THEN
    RAISE EXCEPTION 'NOT_LEADER';
  END IF;

  IF (SELECT is_locked FROM public.teams WHERE id = v_team_id) THEN
    RAISE EXCEPTION 'TEAM_LOCKED';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id AND role = 'participant') THEN
    RAISE EXCEPTION 'RECIPIENT_NOT_FOUND';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM public.team_members WHERE team_id = v_team_id;
  IF v_member_count >= public.team_max_size() THEN
    RAISE EXCEPTION 'TEAM_FULL';
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = p_recipient_id AND team_id = v_team_id) THEN
    RAISE EXCEPTION 'ALREADY_IN_TEAM';
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = p_recipient_id) THEN
    RAISE EXCEPTION 'ALREADY_IN_OTHER_TEAM';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.team_invitations
    WHERE sender_id = v_uid AND recipient_id = p_recipient_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_PENDING';
  END IF;

  SELECT created_at INTO v_last_sent
  FROM public.team_invitations
  WHERE sender_id = v_uid AND recipient_id = p_recipient_id
  ORDER BY created_at DESC LIMIT 1;

  IF v_last_sent IS NOT NULL
     AND v_last_sent > NOW() - (public.team_invite_cooldown_seconds() || ' seconds')::INTERVAL THEN
    RAISE EXCEPTION 'COOLDOWN_ACTIVE';
  END IF;

  BEGIN
    INSERT INTO public.team_invitations (team_id, sender_id, recipient_id)
    VALUES (v_team_id, v_uid, p_recipient_id)
    RETURNING id INTO v_invitation_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'DUPLICATE_PENDING';
  END;

  SELECT name INTO v_sender_name FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.notifications (user_id, type, team_invitation_id, message)
  VALUES (p_recipient_id, 'team_invitation', v_invitation_id, v_sender_name || ' invited you to join their team.')
  ON CONFLICT (team_invitation_id) DO NOTHING;

  RETURN v_invitation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_invitation_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  v_status TEXT;
  v_recipient_id UUID;
  v_member_count INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT team_id, status, recipient_id INTO v_team_id, v_status, v_recipient_id
  FROM public.team_invitations WHERE id = p_invitation_id
  FOR UPDATE;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND';
  END IF;

  IF v_recipient_id <> v_uid THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'INVITATION_NOT_PENDING';
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'ALREADY_IN_TEAM';
  END IF;

  PERFORM 1 FROM public.teams WHERE id = v_team_id FOR UPDATE;

  IF (SELECT is_locked FROM public.teams WHERE id = v_team_id) THEN
    RAISE EXCEPTION 'TEAM_LOCKED';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM public.team_members WHERE team_id = v_team_id;
  IF v_member_count >= public.team_max_size() THEN
    RAISE EXCEPTION 'TEAM_FULL';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role) VALUES (v_team_id, v_uid, 'member');

  UPDATE public.team_invitations SET status = 'accepted', responded_at = NOW() WHERE id = p_invitation_id;
  UPDATE public.notifications SET is_read = TRUE WHERE team_invitation_id = p_invitation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_team_member(p_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_my_team_id UUID;
  v_my_role TEXT;
  v_target_team_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF p_member_id = v_uid THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_SELF';
  END IF;

  SELECT team_id, role INTO v_my_team_id, v_my_role FROM public.team_members WHERE user_id = v_uid;

  IF v_my_team_id IS NULL OR v_my_role <> 'leader' THEN
    RAISE EXCEPTION 'NOT_LEADER';
  END IF;

  IF (SELECT is_locked FROM public.teams WHERE id = v_my_team_id) THEN
    RAISE EXCEPTION 'TEAM_LOCKED';
  END IF;

  SELECT team_id INTO v_target_team_id FROM public.team_members WHERE user_id = p_member_id FOR UPDATE;

  IF v_target_team_id IS NULL OR v_target_team_id <> v_my_team_id THEN
    RAISE EXCEPTION 'NOT_TEAM_MEMBER';
  END IF;

  DELETE FROM public.team_members WHERE user_id = p_member_id AND team_id = v_my_team_id;
END;
$$;

-- ---------- get_my_team: now includes lock + submission + score ----------
CREATE OR REPLACE FUNCTION public.get_my_team()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  result JSON;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT team_id INTO v_team_id FROM public.team_members WHERE user_id = v_uid;

  IF v_team_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', t.id,
    'name', t.name,
    'leaderId', t.leader_id,
    'isLeader', t.leader_id = v_uid,
    'capacity', public.team_max_size(),
    'isLocked', t.is_locked,
    'lockedAt', t.locked_at,
    'projectDescription', t.project_description,
    'deployLink', t.deploy_link,
    'screenshotUrl', t.screenshot_url,
    'score', t.score,
    'feedback', t.feedback,
    'members', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', p.id,
        'name', p.name,
        'email', p.email,
        'role', m.role,
        'joinedAt', m.joined_at
      ) ORDER BY m.joined_at ASC), '[]'::json)
      FROM public.team_members m
      JOIN public.profiles p ON p.id = m.user_id
      WHERE m.team_id = t.id
    )
  ) INTO result
  FROM public.teams t
  WHERE t.id = v_team_id;

  RETURN result;
END;
$$;

-- ---------- Locking ----------

-- Leader self-lock. Idempotent no-op if already locked.
CREATE OR REPLACE FUNCTION public.lock_team()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
  v_role TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT team_id, role INTO v_team_id, v_role FROM public.team_members WHERE user_id = v_uid;
  IF v_team_id IS NULL THEN RAISE EXCEPTION 'NO_TEAM'; END IF;
  IF v_role <> 'leader' THEN RAISE EXCEPTION 'NOT_LEADER'; END IF;
  UPDATE public.teams SET is_locked = TRUE, locked_at = NOW() WHERE id = v_team_id AND is_locked = FALSE;
END; $$;

-- Admin unlock of one team. Does not touch score/submission.
CREATE OR REPLACE FUNCTION public.unlock_team(p_team_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  UPDATE public.teams SET is_locked = FALSE, locked_at = NULL WHERE id = p_team_id;
END; $$;

-- Global "Lock Team Formation" toggle. Turning it on force-locks every
-- team that hasn't self-locked yet; turning it off does NOT auto-unlock
-- any team (unlocking stays a per-team admin action via unlock_team).
CREATE OR REPLACE FUNCTION public.set_team_formation_lock(p_locked BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  UPDATE public.event_config SET team_formation_locked = p_locked, updated_at = NOW() WHERE id = 1;
  IF p_locked THEN
    UPDATE public.teams SET is_locked = TRUE, locked_at = NOW() WHERE is_locked = FALSE;
  END IF;
END; $$;

-- ---------- Submission ----------

-- Submit/update the team's shared project. Any member may call.
-- Requires: team locked AND global submissions window open.
CREATE OR REPLACE FUNCTION public.submit_team_project(
  p_description TEXT, p_deploy_link TEXT, p_screenshot_url TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT team_id INTO v_team_id FROM public.team_members WHERE user_id = v_uid;
  IF v_team_id IS NULL THEN RAISE EXCEPTION 'NO_TEAM'; END IF;

  IF COALESCE((SELECT submissions_locked FROM public.event_config WHERE id = 1), FALSE) THEN
    RAISE EXCEPTION 'SUBMISSIONS_LOCKED';
  END IF;

  IF NOT COALESCE((SELECT is_locked FROM public.teams WHERE id = v_team_id), FALSE) THEN
    RAISE EXCEPTION 'TEAM_NOT_LOCKED';
  END IF;

  UPDATE public.teams
  SET project_description = p_description, deploy_link = p_deploy_link, screenshot_url = p_screenshot_url
  WHERE id = v_team_id;
END; $$;

-- Clears the team's submission. Any member may call. Same gating as submit.
CREATE OR REPLACE FUNCTION public.revert_team_submission()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_team_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT team_id INTO v_team_id FROM public.team_members WHERE user_id = v_uid;
  IF v_team_id IS NULL THEN RAISE EXCEPTION 'NO_TEAM'; END IF;

  IF COALESCE((SELECT submissions_locked FROM public.event_config WHERE id = 1), FALSE) THEN
    RAISE EXCEPTION 'SUBMISSIONS_LOCKED';
  END IF;

  UPDATE public.teams
  SET project_description = NULL, deploy_link = NULL, screenshot_url = NULL
  WHERE id = v_team_id;
END; $$;

-- ---------- Scoring & admin/leaderboard reads ----------

-- Admin scoring. Independent of lock state (admin can score anytime).
CREATE OR REPLACE FUNCTION public.score_team(p_team_id UUID, p_score INTEGER, p_feedback TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  IF p_score IS NOT NULL AND (p_score < 0 OR p_score > 100) THEN RAISE EXCEPTION 'INVALID_SCORE'; END IF;
  UPDATE public.teams
  SET score = p_score, feedback = NULLIF(TRIM(COALESCE(p_feedback, '')), '')
  WHERE id = p_team_id;
END; $$;

-- Admin dashboard: every team + roster + submission + score + lock state.
CREATE OR REPLACE FUNCTION public.admin_list_teams()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  RETURN (
    SELECT COALESCE(json_agg(json_build_object(
      'id', t.id, 'name', t.name, 'leaderId', t.leader_id,
      'isLocked', t.is_locked, 'lockedAt', t.locked_at,
      'projectDescription', t.project_description, 'deployLink', t.deploy_link,
      'screenshotUrl', t.screenshot_url, 'score', t.score, 'feedback', t.feedback,
      'members', (
        SELECT COALESCE(json_agg(json_build_object(
          'id', p.id, 'name', p.name, 'email', p.email, 'role', m.role
        ) ORDER BY m.joined_at ASC), '[]'::json)
        FROM public.team_members m JOIN public.profiles p ON p.id = m.user_id
        WHERE m.team_id = t.id
      )
    ) ORDER BY t.created_at DESC), '[]'::json)
    FROM public.teams t
  );
END; $$;

-- Public leaderboard. Gated by event_config.scores_published; ranking
-- and tie handling done client-side, this just returns raw rows.
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_published BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  SELECT scores_published INTO v_published FROM public.event_config WHERE id = 1;

  IF NOT COALESCE(v_published, FALSE) THEN
    RETURN json_build_object('published', false, 'teams', '[]'::json);
  END IF;

  RETURN json_build_object(
    'published', true,
    'teams', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', t.id, 'name', t.name, 'score', t.score,
        'members', (
          SELECT COALESCE(json_agg(json_build_object('id', p.id, 'name', p.name)), '[]'::json)
          FROM public.team_members m JOIN public.profiles p ON p.id = m.user_id
          WHERE m.team_id = t.id
        )
      ) ORDER BY t.score DESC NULLS LAST, t.name ASC), '[]'::json)
      FROM public.teams t
    )
  );
END; $$;

-- ---------- Grants ----------
GRANT EXECUTE ON FUNCTION public.lock_team() TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_team(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_team_formation_lock(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_team_project(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revert_team_submission() TO authenticated;
GRANT EXECUTE ON FUNCTION public.score_team(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_teams() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

-- ---------- Clean cutover: drop the old per-individual columns ----------
-- Safe: this project only has test data at the time of this migration.
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS project_description,
  DROP COLUMN IF EXISTS deploy_link,
  DROP COLUMN IF EXISTS screenshot_url,
  DROP COLUMN IF EXISTS score,
  DROP COLUMN IF EXISTS feedback;
