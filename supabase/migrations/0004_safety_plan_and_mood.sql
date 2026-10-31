-- The person's own safety plan (Stanley-Brown steps), kept on their profile.
alter table public.profiles add column if not exists safety_plan jsonb;

-- Self-rated mood (0-10) at the start and end of a conversation, and "Did you feel heard?".
alter table public.sessions add column if not exists mood_start smallint check (mood_start between 0 and 10);
alter table public.sessions add column if not exists mood_end smallint check (mood_end between 0 and 10);
alter table public.sessions add column if not exists heard text check (heard in ('yes', 'somewhat', 'no'));
