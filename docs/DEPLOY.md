# Deploying

## Quickest: a test site with Gemini only (free)

You need no Supabase and no ElevenLabs for this. Everything is saved in each tester's browser, and voice uses the browser's own speech.

1. Get a free key at **aistudio.google.com** → Get API key.
2. On **vercel.com**, import the repository and add one environment variable: `GEMINI_API_KEY`.
3. Deploy, and open the link on your phone.

Limits: Gemini's free tier allows only a few requests a minute, and each message uses two. Google may use free-tier content to improve its products, so testers should know that (the privacy page says so). Switch to a paid key or Claude before real users.

## Full setup

The app is a standard Next.js app. The recommended setup is **Vercel** for the app and **Supabase** for accounts and data.

## 1. Supabase (accounts and data)

1. Create a Supabase project.
2. Apply the schema with `supabase db push`, or paste each file in `supabase/migrations/` into the SQL editor, in order (`0001_init.sql`, `0002_reflection_feedback.sql`, `0003_quiet_sky.sql`).
3. **Auth → Providers:**
   - Enable **Email**. Magic links are used; no passwords.
   - Optionally enable **Google**: create an OAuth client in Google Cloud and paste its ID and secret.
4. **Auth → URL configuration:**
   - Site URL: `https://your-domain`
   - Redirect URLs: `https://your-domain/auth/callback` and `http://localhost:3000/auth/callback`
5. Copy the project URL and the anon (publishable) key.

## 2. ElevenLabs (voice)

1. Create an API key with Text to Speech and Speech to Text access.
2. Pick a default voice and copy its ID into `ELEVENLABS_VOICE_ID`.
3. Optional: list the voices people can choose in Settings as `ELEVENLABS_VOICES="id:Name,id:Name"`.

## 3. Vercel

1. Import the repository.
2. Set these environment variables:
   - `ANTHROPIC_API_KEY` (or `GEMINI_API_KEY`)
   - `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, and optionally `ELEVENLABS_VOICES`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy. Every pull request gets a preview deployment.

## Before going to production

- **Rate limiting:** `src/lib/server/rateLimit.ts` is in-memory per instance. Behind multiple instances, replace it with a shared store (e.g. Upstash Redis) or use Vercel's WAF rate limiting on `/api/*`. This matters for cost: the API routes are open to guests.
- **Abuse protection:** consider a bot check (e.g. Turnstile) before the first conversation for guests.
- **Analytics and errors:** PostHog and Sentry are in the spec but not wired in yet. Whatever you add, **never send conversation content**.

## Launch checklist (docs/SPEC.md §8, §11)

- [ ] Client sign-off on the public product name (avoid "therapy/therapist" in public copy).
- [ ] Legal review of the privacy summary, terms, and consent copy, including the region-specific rules on AI and mental health.
- [ ] Verify every crisis line in `src/lib/safety/resources.ts` for each launch region.
- [ ] A licensed clinician reviews the companion prompt (`src/lib/prompts/companion.ts`) and the safety flows.
- [ ] `npm run eval` passes: safety 100%, conversation quality at threshold.
- [ ] Confirm data-retention and no-training terms with Anthropic and ElevenLabs, and reflect them in the privacy policy.
- [ ] Test voice on real devices: iOS Safari, Android Chrome, and desktop Chrome, Safari, and Firefox (Firefox has no browser speech recognition, so it needs ElevenLabs).
- [ ] Decide on paid plans. The `profiles.plan` column is reserved and protected from user edits.
