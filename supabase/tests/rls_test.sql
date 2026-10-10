\set ON_ERROR_STOP on
insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'a@x'), ('22222222-2222-2222-2222-222222222222', 'b@x');
select count(*) as profiles_created from public.profiles;

-- As user A
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
update public.profiles set display_name = 'Sam', consented_at = now() where id = auth.uid();
insert into public.sessions (id, mode) values ('aaaaaaaa-0000-0000-0000-000000000001', 'text');
insert into public.messages (session_id, role, content) values ('aaaaaaaa-0000-0000-0000-000000000001', 'user', 'hello');
insert into public.reflections (session_id, title, insight, weather, themes, quotes) values ('aaaaaaaa-0000-0000-0000-000000000001', 'T', 'I', 'clear', '{work}', '["q"]');
insert into public.memories (fact, category, source_session_id) values ('Sister Maya', 'person', 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.memories (fact, category) values ('Likes walks', 'helps');
insert into public.safety_events (session_id, risk_level, action_taken) values ('aaaaaaaa-0000-0000-0000-000000000001', 'elevated', 'resources_shown');
select 'A sees sessions' as check, count(*) from public.sessions;

-- Plan cannot be changed by the user
\set ON_ERROR_STOP off
update public.profiles set plan = 'pro' where id = auth.uid();
\set ON_ERROR_STOP on

-- As user B
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'B sees A sessions' as check, count(*) from public.sessions;
select 'B sees A messages' as check, count(*) from public.messages;
select 'B sees A memories' as check, count(*) from public.memories;
select 'B sees A profile' as check, count(*) from public.profiles where id = '11111111-1111-1111-1111-111111111111';
\set ON_ERROR_STOP off
insert into public.messages (session_id, role, content) values ('aaaaaaaa-0000-0000-0000-000000000001', 'user', 'intrusion');
\set ON_ERROR_STOP on
select 'B sees safety events' as check, count(*) from public.safety_events;

-- Back to A: deleting a session cascades
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
delete from public.sessions where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select 'A messages after delete' as check, count(*) from public.messages;
select 'A memories after delete (sourced one gone)' as check, count(*) from public.memories;
select public.delete_my_account();
reset role;
select 'users left' as check, count(*) from auth.users;
select 'A memories after account delete' as check, count(*) from public.memories where user_id = '11111111-1111-1111-1111-111111111111';
