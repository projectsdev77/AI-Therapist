# Haven — AI Therapist project

A voice-first AI companion for everyday conversations, emotional support, and self-reflection. It is designed to feel like a calm presence, not a chatbot.

> "Haven" is a placeholder public name (see [docs/SPEC.md §11](docs/SPEC.md)). Change it in `src/lib/brand.ts`.

- **Spec:** [docs/SPEC.md](docs/SPEC.md)
- **Deploying:** [docs/DEPLOY.md](docs/DEPLOY.md)
- **Design handoff (for the redesign):** [docs/DESIGN_HANDOFF.md](docs/DESIGN_HANDOFF.md)
- **Client reference mock:** https://ai-therapist-1.lovable.app

## What's in it

| Area | What it does |
|---|---|
| **The Presence** | A WebGL orb that breathes, listens (reacts to your mic), thinks, speaks (moves with its voice), and settles when you're struggling. It is tinted by the tone of the conversation. |
| **Talk or Write** | Voice conversations (ElevenLabs, or the browser's speech APIs) or typing. Both use film-style captions, never chat bubbles. You can interrupt it by talking. |
| **Safety** | A consent screen before the first conversation (18+, not therapy, not for emergencies), an always-visible Get help button, risk detection on every message (model + keyword backstop), and a support panel with region-aware crisis lines. |
| **Reflection cards** | Each conversation is folded into a card: a title, your own words, one insight, and a small next step. You can save it as an image. |
| **Inner Weather** | Each session gets a sky (clear, haze, drizzle, storm, sun breaking through), and *Your skies* shows the last 30 days. |
| **Your patterns** | A constellation of recurring themes and how they connect. |
| **Memory (on by default)** | It remembers what matters across sessions, the way a counselor keeps notes. *What I remember* lets you see, edit, add, or delete any of it, or turn memory off. |
| **Accounts** | Guests keep everything on-device (IndexedDB). Signing in (email link or Google, via Supabase) moves it to the cloud with Row-Level Security. |
| **Breathe** | The orb becomes a breath pacer (box, 4-7-8, slow exhale), with optional haptics. |
| **Your data** | Export everything as JSON, or delete everything with a typed confirmation. |

## Run it

```bash
npm install
cp .env.example .env.local   # every key is optional
npm run dev                  # http://localhost:3000
```

**Demo mode.** With no keys, everything still works:
- Replies are scripted reflective responses, labeled "Demo mode" on screen.
- Voice uses the browser's speech recognition and synthesis.
- Data stays on the device.

Add keys to turn on each real service:

| Key | Turns on |
|---|---|
| `ANTHROPIC_API_KEY` | Real conversations, analysis, reflections, and memory, using Claude |
| `ELEVENLABS_API_KEY` (+ `ELEVENLABS_VOICE_ID`) | Natural voice, transcription, and voice choice (`ELEVENLABS_VOICES`) |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Accounts and cloud storage (apply `supabase/migrations` first) |

`/lab` is a living style guide that shows every orb state, tone, sky, and theme.

## Scripts

| Command | |
|---|---|
| `npm run dev` | Development server |
| `npm run check` | Lint, typecheck, and unit tests |
| `npm run build && npm run test:e2e` | Playwright end-to-end tests with axe accessibility checks (mobile and desktop) |
| `npm run eval` | Model evals: safety (must pass 100%) and conversation quality. Needs `ANTHROPIC_API_KEY`. |

Database policy tests: see [supabase/tests/README.md](supabase/tests/README.md).

## Project layout

```
src/app/            routes: / talk history patterns memory settings breathe signin lab, api/*
src/components/     presence (orb), sky, captions, breathe, talk, reflection, history, patterns, safety, ...
src/lib/
  conversation/     protocol, useConversation hook, context building, weather
  llm/              Claude calls: reply streaming, analysis, reflection, demo mode
  prompts/          companion persona and system prompts (versioned)
  voice/            mic + VAD, recognizers, speakers, sentence chunker, useVoice
  data/             DataStore interface, LocalStore (IndexedDB), SupabaseStore
  safety/           crisis resources, keyword backstop
src/styles/tokens.css   design tokens: the single source for every color, font, and motion
supabase/           migrations (RLS) and policy tests
evals/              safety + conversation eval sets and runner
tests/              unit (Vitest) and e2e (Playwright)
```
