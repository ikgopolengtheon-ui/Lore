-- Lore — chat persistence schema.
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query →
-- paste → Run. Also enable anonymous sign-ins: Authentication → Sign In / Up →
-- (or Settings) → turn on "Allow anonymous sign-ins".
--
-- One row per chat session. The full Session object is stored as jsonb; the
-- indexed columns (user_id, last_active) drive per-user listing. Row-level
-- security ensures each user only ever sees and mutates their own chats.

create table if not exists public.chats (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data        jsonb not null,
  last_active timestamptz not null default now()
);

alter table public.chats enable row level security;

drop policy if exists "own chats select" on public.chats;
drop policy if exists "own chats insert" on public.chats;
drop policy if exists "own chats update" on public.chats;
drop policy if exists "own chats delete" on public.chats;

create policy "own chats select" on public.chats
  for select using (auth.uid() = user_id);
create policy "own chats insert" on public.chats
  for insert with check (auth.uid() = user_id);
create policy "own chats update" on public.chats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own chats delete" on public.chats
  for delete using (auth.uid() = user_id);

create index if not exists chats_user_active
  on public.chats (user_id, last_active desc);

-- Waitlist for the marketing landing page. Writes go through /api/waitlist
-- using the secret key (service role), which bypasses RLS. RLS is enabled with
-- no policies so the public/anon key can neither read nor write it.
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
