// Mirrors team_max_size() / team_invite_cooldown_seconds() in
// files/team_system_schema.sql. Keep both in sync if either changes —
// the database is the final authority; these drive UI/early validation.
export const MAX_TEAM_SIZE = 3
export const INVITE_COOLDOWN_SECONDS = 10
