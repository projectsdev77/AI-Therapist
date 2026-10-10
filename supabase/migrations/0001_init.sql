-- Haven schema. Every table is private to its owner via Row-Level Security.
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

create extension if not exists pgcrypto;

-- Profile: one row per auth user, created on signup.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  memory_enabled boolean not null default true,
  voice_id text,
  region text check (char_length(region) <= 8),
  consented_at timestamptz,
  client_summary text check (char_length(client_summary) <= 4000),
  client_summary_updated_at timestamptz,
  -- Reserved for paid plans (client decision, docs/SPEC.md §11).
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mode text not null check (mode in ('voice', 'text')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  weather text check (weather in ('clear', 'haze', 'drizzle', 'storm', 'breaking')),
  tone_start text,
  tone_end text,
  title text check (char_length(title) <= 200)
);
create index sessions_user_started on public.sessions (user_id, started_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  role text not null check (role in ('user', 'companion')),
  content text not null check (char_length(content) <= 8000),
  tone text,
  risk_level text check (risk_level in ('none', 'low', 'elevated', 'acute')),
  interrupted boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_session_created on public.messages (session_id, created_at);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid not null unique references public.sessions (id) on delete cascade,
  title text not null,
  quotes jsonb not null default '[]'::jsonb,
  insight text not null,
  next_step text,
  themes text[] not null default '{}',
  weather text not null check (weather in ('clear', 'haze', 'drizzle', 'storm', 'breaking')),
  created_at timestamptz not null default now()
);
create index reflections_user_created on public.reflections (user_id, created_at desc);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fact text not null check (char_length(fact) <= 400),
  category text not null check (category in ('person', 'situation', 'goal', 'pattern', 'helps', 'preference', 'other')),
  -- Deleting a session deletes the memories learned from it.
  source_session_id uuid references public.sessions (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index memories_user_updated on public.memories (user_id, updated_at desc);

-- Metadata only: never message content.
create table public.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  risk_level text not null check (risk_level in ('none', 'low', 'elevated', 'acute')),
  action_taken text not null,
  created_at timestamptz not null default now()
);

-- Row-Level Security: owners only.
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.reflections enable row level security;
alter table public.memories enable row level security;
alter table public.safety_events enable row level security;

create policy "own profile" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own sessions" on public.sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own messages" on public.messages for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy "own reflections" on public.reflections for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy "own memories" on public.memories for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Safety events are write-only for the user (reviewed by staff with the service role).
create policy "insert own safety events" on public.safety_events for insert
  with check (user_id = auth.uid());

-- Users can edit their profile but not their plan (column grants; a column-level
-- revoke would not override Supabase's default table-level grant).
revoke insert, update on public.profiles from authenticated, anon;
grant update (display_name, memory_enabled, voice_id, region, consented_at, client_summary, client_summary_updated_at)
  on public.profiles to authenticated;

-- Create a profile for every new user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- "Delete everything": removes the auth user, which cascades to all data.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
