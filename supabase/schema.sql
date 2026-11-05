-- MindForge private vault.
-- No Supabase Auth users are created. The Next.js server authenticates access
-- with the private passcode and uses the server-only service-role key.
-- Never expose SUPABASE_SERVICE_ROLE_KEY to the browser or Android bundle.

create table if not exists public.mindforge_vault (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.mindforge_vault enable row level security;

-- Browser/anon/authenticated clients cannot read or write the vault.
revoke all on table public.mindforge_vault from anon, authenticated;
grant all on table public.mindforge_vault to service_role;

-- Intentionally create no anon/authenticated policies. Access is exclusively
-- through the authenticated Next.js server route handlers.
