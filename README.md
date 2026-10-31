# Haven — AI Therapist project

A voice-first AI companion for everyday conversations, emotional support, and self-reflection. It is designed to feel like a calm presence, not a chatbot.

> "Haven" is a placeholder public name (see [docs/SPEC.md §11](docs/SPEC.md)). Change it in `src/lib/brand.ts`.

- **Spec:** [docs/SPEC.md](docs/SPEC.md)
- **Deploying:** [docs/DEPLOY.md](docs/DEPLOY.md)
- **Visual design:** "Deep lagoon" (v2) by the designer, in [docs/design-handoff/from-designer-v2/](docs/design-handoff/from-designer-v2/README.md). Open the `.dc.html` files there for every screen and state; [IMPLEMENTATION_NOTES.md](docs/design-handoff/from-designer-v2/IMPLEMENTATION_NOTES.md) lists where the build differs.
- **Design handoff (for the redesign):** [docs/DESIGN_HANDOFF.md](docs/DESIGN_HANDOFF.md), with the prompt for Claude Design in [docs/design-handoff/PROMPT.md](docs/design-handoff/PROMPT.md)
- **Client reference mock:** https://ai-therapist-1.lovable.app

## What's in it

| Area | What it does |
|---|---|
| **The orb** | A living orb with eyes that floats, leans in while you talk, looks away while it thinks, pulses while it speaks, and goes still and soft when you're struggling. |
| **Landing page** | `/` explains what it is for first-time visitors; returning visitors go straight to their Home at `/home`. |
| **Talk or Write** | Voice conversations (ElevenLabs, or the browser's speech APIs) or typing. Both use film-style captions, never chat bubbles. You can interrupt it by talking. |
| **Safety** | A consent screen before the first conversation (18+, not therapy, not for emergencies), an always-visible Get help button, risk detection on every message (model + keyword backstop), and a support panel with region-aware crisis lines. |
| **Reflection cards** | Each conversation is folded into a card: a title, your own words, one insight, and a small next step. You can save it as an image. |
| **Inner Weather** | Each session gets a sky (clear, haze, drizzle, storm, sun breaking through), and *Your skies* shows the last 30 days. |
| **Your patterns** | A constellation of recurring themes and how they connect. |
| **Memory (on by default)** | It remembers what matters across sessions, the way a counselor keeps notes. *What I remember* lets you see, edit, add, or delete any of it, or turn memory off. |
| **Accounts** | Guests keep everything on-device (IndexedDB). Signing in (email link or Google, via Supabase) moves it to the cloud with Row-Level Security. |
| **Ambient sound** | Optional (off by default): soft rain, room tone, or a low hum under the conversation, or matched to the sky. It ducks whenever anyone speaks and never feeds the voice detection. Swap in your own recordings in `public/audio/` (see its README). |
| **Breathe** | The orb becomes a breath pacer (Calm 4·6, Box, Deep 4·7·8), with optional vibration. |
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
| `GEMINI_API_KEY` | The same using Google Gemini, if no Claude key is set (free tier works for testing). Optional `GEMINI_MODEL`. |
| `ELEVENLABS_API_KEY` (+ `ELEVENLABS_VOICE_ID`) | Natural voice, transcription, and voice choice (`ELEVENLABS_VOICES`) |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Accounts and cloud storage (apply `supabase/migrations` first) |

`/lab` is a living style guide that shows every orb state, tone, sky, and theme.

## Scripts

| Command | |
|---|---|
| `npm run dev` | Development server |
| `npm run check` | Lint, typecheck, and unit tests |
| `npm run build && npm run test:e2e` | Playwright end-to-end tests with axe accessibility checks (mobile and desktop) |
| `npm run eval` | Model evals: safety labels, single replies and whole-conversation scenarios (safety must pass 100%). Uses `GEMINI_API_KEY` or `ANTHROPIC_API_KEY`; on the free Gemini tier add `EVAL_CONCURRENCY=1`. Also runs in GitHub Actions ("Safety evals") when the AI code changes. |

Database policy tests: see [supabase/tests/README.md](supabase/tests/README.md).

## Project layout

```
src/app/            routes: / talk history patterns memory settings breathe signin lab, api/*
src/components/     presence (orb), sky, captions, breathe, talk, reflection, history, patterns, safety, ...
src/lib/
  conversation/     protocol, useConversation hook, context building, weather
  llm/              Claude or Gemini calls: reply streaming, analysis, reflection, demo mode
  prompts/          companion persona and system prompts (versioned)
  voice/            mic + VAD, recognizers, speakers, sentence chunker, useVoice
  ambient/          ambient sound: engine, generated loops, mixing rules, sources (your audio files)
  data/             DataStore interface, LocalStore (IndexedDB), SupabaseStore
  safety/           crisis resources, keyword backstop
src/styles/tokens.css   design tokens: the single source for every color, font, and motion
supabase/           migrations (RLS) and policy tests
evals/              safety + conversation eval sets and runner
tests/              unit (Vitest) and e2e (Playwright)
```
