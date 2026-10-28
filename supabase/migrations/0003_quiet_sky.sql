-- Deep lagoon adds a "quiet" sky that people can choose for a conversation.
alter table public.sessions drop constraint if exists sessions_weather_check;
alter table public.sessions
  add constraint sessions_weather_check check (weather in ('clear', 'haze', 'drizzle', 'storm', 'breaking', 'quiet'));
alter table public.reflections drop constraint if exists reflections_weather_check;
alter table public.reflections
  add constraint reflections_weather_check check (weather in ('clear', 'haze', 'drizzle', 'storm', 'breaking', 'quiet'));
