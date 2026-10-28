-- The person's say over their reflection card: feedback, their own edits, and the sky they chose.
alter table public.reflections
  add column feedback text check (feedback in ('right', 'not_quite')),
  add column edited_at timestamptz,
  add column weather_by_person boolean not null default false;
