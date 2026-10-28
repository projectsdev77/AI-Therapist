# Database policy tests

`rls_test.sql` checks the Row-Level Security rules against a plain Postgres 16
with `supabase_shim.sql` standing in for Supabase's `auth` schema and roles.

```bash
createdb haven_test
psql -d haven_test -f supabase/tests/supabase_shim.sql
psql -d haven_test -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init.sql
psql -d haven_test -v ON_ERROR_STOP=1 -f supabase/migrations/0002_reflection_feedback.sql
psql -d haven_test -v ON_ERROR_STOP=1 -f supabase/migrations/0003_quiet_sky.sql
psql -d haven_test -f supabase/tests/rls_test.sql
```

Expected: user B sees 0 of user A's rows, B's insert into A's session and A's
plan change are rejected, deleting a session removes its messages and sourced
memories, and `delete_my_account()` removes everything.
