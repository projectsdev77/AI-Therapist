# AI Therapist — Product & Technical Spec (v0.1)

> **Client brief (verbatim):** "AI therapist for everyday conversations, emotional support, and self-reflection. Stay away from just chatbot — how can we visually stand out?"
> **Reference mock:** https://ai-therapist-1.lovable.app (voice-first landing: "Hello… I'm here to listen", "Speak to Me", powered by ElevenLabs). This is a starting point. We don't need to copy it.
> **Decision authority:** We decide everything except **paid accounts / monetization**, which the client owns (see §11).

---

## 1. Product summary

A calm, voice-first companion that you **talk to, not type at**. Each conversation turns into something you can **see**: a living presence that reacts while you speak, and a visual record of how you've been feeling over time.

**What it is:** everyday emotional support, a place to think out loud, and guided self-reflection.
**What it is not:** a licensed therapist, a diagnosis tool, or a crisis service. The product says so plainly and sends people to real help when it's needed (§8).

### Target user
Adults (18+) who want to process a stressful day, untangle a thought, or check in with themselves. They may not be ready for therapy, may be between sessions, or may just want somewhere private to vent.

### Success criteria for v1
- First conversation starts within **10 seconds** of landing, with no signup required.
- Voice round-trip latency: under **1.5 s** from when the user stops speaking to the first audio.
- More than 40% of first-time users finish one full session and see their reflection card.
- Zero crisis conversations without safety resources shown (100% of eval set).

---

## 2. How we visually stand out (the core differentiator)

A chatbot is a column of bubbles. We have **no chat bubbles**. The interface is built around five ideas:

### 2.1 The Presence (the orb)
A soft, organic, slowly morphing shape in the center of the screen, rendered in WebGL with a shader blob. It is the "face" of the companion and has clear states:

| State | Visual behavior |
|---|---|
| Idle | Slow breathing pulse, ~6 breaths/min |
| Listening | Ripples driven by the user's mic amplitude, and the orb leans toward the user |
| Thinking | Inward swirl and slight contraction |
| Speaking | Surface undulates with the TTS audio waveform |
| Concerned (safety mode) | Settles, warms in color, and goes still. Never alarming red. |

The orb's **color is tinted by the emotional tone of the conversation**. The LLM classifies tone into a small, fixed palette (calm, heavy, anxious, warm, hopeful, frustrated), and we transition hue slowly over ~4 s so the color never flickers.

### 2.2 Captions, not bubbles
The transcript appears as **film-style captions** under the orb. The current line is bright, the previous line fades, and older lines dissolve. The full transcript is one tap away ("Show conversation"), but it is never the main view. This keeps attention on the presence and the voice.

### 2.3 Inner Weather (mood over time)
Every session produces a **weather state**, such as clear, haze, drizzle, storm, or breaking sun. It is derived from tone and how it shifted from the start of the session to the end. The home screen background is a gently animated sky showing *today's* weather. The history view is a **horizontal strip of skies**, one per day, instead of a list of chats. Users read their emotional month at a glance.

### 2.4 Reflection Cards
When a session ends, the conversation folds into a **reflection card**, a beautifully typeset artifact rather than a log. Each card has:
- A title that names the theme ("Feeling stretched thin at work")
- 2–3 things the user said that mattered, in their own words
- One gentle reframe or insight
- One tiny, optional next step ("Text your sister tonight")
- That session's weather glyph

Users can save cards, revisit them, or export them as an image. They replace the "chat history" list.

### 2.5 Thought Constellations
Recurring themes across sessions (work, sleep, a person, self-worth) appear as **stars connected into constellations** on a dark canvas. Tapping a star shows the sessions where that theme came up. This view is "Your patterns". It makes self-reflection visual and gives returning users a reason to come back.

### 2.6 Breathe mode
At any point, the user (or the companion, by suggestion) can switch to Breathe. The orb becomes a **breath pacer** that expands and contracts, with optional soft haptics on mobile. It defaults to box breathing (4-4-4-4) and also offers 4-7-8.

### Visual language
- **Palette:** deep twilight base (indigo/ink) with soft luminous accents. Light mode is "dawn": warm off-white with peach and lavender. No clinical white or corporate blue.
- **Type:** an editorial serif for headings and reflection cards (e.g. *Fraunces*), with a humanist sans for UI (e.g. *Inter*).
- **Motion:** slow and eased. Nothing snaps. Every animation lasts 400 ms or more, except for direct feedback. `prefers-reduced-motion` swaps shaders for static gradients.
- **Sound:** optional low ambient bed (rain, room tone), muted by default.

---

## 3. Core user flows

### 3.1 First visit (no account)
1. The landing page shows the Presence breathing. Copy: *"Hello. I'm here to listen."* Two equal buttons: **Talk** and **Write**. Users can switch between them at any time, even mid-session.
2. A one-time consent sheet explains in plain language that this is not therapy, shows crisis resources, confirms the user is 18+, and states the privacy summary, including that **conversations are saved so the companion can remember you** (with a link to turn it off). The user taps "I understand".
3. The browser asks for mic permission. The companion opens: *"What's on your mind today?"*
4. The conversation runs. Push-to-talk and hands-free (VAD) modes are both available, with hands-free as the default.
5. The user taps **End**. The reflection card is generated and the sky updates.
6. A soft prompt says *"Want to keep this? Create a free account."* Guest data lives on the device only until the user signs up.

### 3.2 Returning user
The home screen shows today's sky, a "Talk" button, the last reflection card, and an entry into **Your patterns**. The companion opens with context by default: *"Last time you mentioned the presentation. How did it go?"* Like a therapist reviewing notes before a session, it draws on past sessions, reflection cards, and remembered facts (§5.1, §7).

### 3.3 Write mode
A full text option, equal to voice, for anyone who prefers typing or can't speak out loud right now. Users can switch between Talk and Write mid-session. It keeps the same visual system: the orb stays, replies appear as captions, and there are still no bubbles. Typed messages appear briefly as a caption and then fade.

### 3.4 Crisis flow
See §8.

---

## 4. Feature scope

### MVP (v1)
- Voice conversation (STT → LLM → TTS, streaming)
- Write mode
- The Presence orb with all states and tone tinting
- Captions UI and expandable transcript
- Reflection card at session end
- Inner Weather (today and history strip)
- Breathe mode
- Guest mode (local only) and accounts (email magic link + Google)
- Memory across sessions, **on by default** (visible and editable)
- Safety layer: crisis detection, resources, disclaimers, 18+ gate
- Data controls: export all, delete all
- Responsive web (mobile-first) and an installable PWA

### v1.1+
- Thought Constellations
- Card image export / share
- Daily check-in reminder (push / email, opt-in)
- Choice of voices and companion styles (gentle, direct, curious)
- Multi-language support
- Native apps (only if the PWA proves insufficient)

### Explicitly out of scope
- Diagnosis, treatment plans, medication advice
- Human therapist marketplace or handoff (possibly later, client decision)
- Payments (client decision, §11)

---

## 5. Conversation design

**Persona:** warm, curious, unhurried, and plainspoken. It reflects back before advising. It asks one question at a time and keeps replies short (2–4 sentences spoken), because walls of speech are tiring to listen to. It never claims to be human or a licensed professional.

**Techniques it may use:** reflective listening, open questions, light CBT-style reframing ("what's another way to look at that?"), grounding, values clarification, and suggesting tiny next steps.

**It must not:** diagnose, give medical or medication advice, encourage dependence ("you only need me"), or claim to remember things it doesn't have (for example, when the user turned memory off).

**Structured side outputs**, produced alongside each reply (via structured output, not shown to the user):
- `tone`: one of the fixed palette values (drives orb color)
- `risk_level`: `none | low | elevated | acute` (drives the safety layer)
- `themes`: short tags (feeds reflection cards and constellations)

**End-of-session pass:** a separate call over the transcript produces the reflection card JSON, the weather state, and memory updates (new/changed facts plus a refreshed profile summary, §5.1).


### 5.1 Memory (on by default)
A therapist remembers their clients, so the companion does too. Every session is saved, and memory is built in three layers:

1. **Session record:** the full transcript and its reflection card (stored in `sessions`, `messages`, `reflections`).
2. **Remembered facts:** after each session, the end-of-session pass extracts durable facts and updates existing ones. Examples: people in the user's life ("sister: Maya, close but tense lately"), ongoing situations ("big presentation on the 14th"), goals, what helped before ("box breathing works for them"), and preferences ("prefers direct feedback").
3. **Client profile summary:** a short running summary, like a therapist's case notes, rewritten after each session from the facts and recent reflections.

At the start of each session the companion receives the profile summary, the relevant facts, and the last 2–3 reflection cards. It uses them naturally ("How did the talk with Maya go?") and never recites them back like a database.

**Guests:** memory works on the device (IndexedDB). On signup, guests can move it into their account.

---

## 6. Technical architecture

### Stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (App Router) + TypeScript + Tailwind CSS** | One codebase for landing, app, and API routes. Strong ecosystem. |
| Motion / visuals | **Framer Motion** for UI, **react-three-fiber + custom GLSL** for the orb and sky | The orb needs to be a real shader to feel alive |
| Auth + DB | **Supabase** (Postgres, Auth, Row-Level Security) | Fast to ship, RLS gives per-user isolation by default, matches the Lovable ecosystem the client used |
| LLM | **Claude via the Anthropic TypeScript SDK** (`@anthropic-ai/sdk`), streaming | Strong on careful, empathetic, safety-aware conversation |
| Speech-to-text | **ElevenLabs Scribe (realtime)**, with browser Web Speech API as fallback | The client's mock already uses ElevenLabs |
| Text-to-speech | **ElevenLabs streaming TTS** | Natural, warm voices with low latency |
| Hosting | **Vercel** (app) + Supabase (data) | Zero-ops, preview deploy per PR |
| Analytics | **PostHog** (self-hostable, privacy-friendly), with **no conversation content** sent | Product metrics without leaking sensitive data |
| Errors | **Sentry**, with PII and transcript scrubbing on | Same reason |

### Model choice
- **Conversation:** `claude-opus-5-5` with adaptive thinking and **low effort**, plus streaming. Low effort keeps time-to-first-token small for voice. We will tune effort against an eval set (§9).
- **Reflection card / weather / themes:** `claude-opus-5-5` at medium effort with structured outputs. This runs once per session and isn't latency-sensitive.
- **Refusal handling:** check `stop_reason` and enable server-side fallbacks (`fallbacks: "default"`) so a classifier refusal never leaves the user in silence.
- **Cost lever for later:** if per-session cost becomes an issue, measure a cheaper model on the same eval set before switching. We won't switch on a guess.

### Voice pipeline
```
mic → VAD (client) → STT stream ─┐
                                 ▼
                     /api/converse (server)
                     Claude stream → sentence chunker ─→ TTS stream → audio out
                                 │                           │
                     tone/risk/themes JSON            amplitude → orb
```
- Text is chunked to TTS **by sentence** so speech starts before the full reply is done.
- Barge-in: if the user starts speaking, playback stops immediately and the partial reply is marked interrupted.
- All API keys stay server-side. The browser never sees the Anthropic or ElevenLabs keys.

### Data model (Postgres)
```
profiles        (id, display_name, memory_enabled default true, voice_id, created_at)
sessions        (id, user_id, mode[voice|text], started_at, ended_at,
                 weather, tone_start, tone_end)
messages        (id, session_id, role, content, tone, risk_level, created_at)
reflections     (id, session_id, title, quotes jsonb, insight, next_step, themes text[])
memories        (id, user_id, fact, category, source_session_id, created_at, updated_at)
safety_events   (id, session_id, risk_level, action_taken, created_at)
```
RLS applies to every table: `user_id = auth.uid()`. Guest sessions are stored in IndexedDB and uploaded on signup if the user chooses to keep them.

### Proposed repo layout
```
/app            Next.js routes (landing, /talk, /history, /patterns, /settings, /api/*)
/components     UI, including /presence (orb), /sky, /captions, /cards
/lib            llm/, voice/, safety/, db/
/prompts        system prompt + summarization prompt (versioned)
/evals          conversation + safety eval sets and runner
/docs           this spec, ADRs
/supabase       migrations, RLS policies
```

---

## 7. Privacy & data

- Data is encrypted in transit (TLS) and at rest (Supabase default).
- **Memory is on by default** and fully visible. A "What I remember about you" page lists every remembered fact. Users can edit or delete any fact, delete individual sessions, or turn memory off entirely (which stops new memories and stops using old ones).
- **Export all** (JSON + card images) and **Delete everything** (hard delete, within 30 days from backups) are available in Settings.
- Conversation content never goes to analytics or error tracking.
- We do not use conversation data to train models. We'll confirm vendor data-retention terms (Anthropic, ElevenLabs) and document them in the privacy policy.
- Privacy policy and terms are written in plain language, linked from the consent sheet. **These need legal review before launch.**

---

## 8. Safety (non-negotiable)

1. **Consent gate** before the first conversation: not therapy, not for emergencies, 18+, privacy summary.
2. **Always-visible "Get help now"** affordance (a small icon) on every conversation screen.
3. **Risk detection** on every turn, from the `risk_level` side output plus a keyword backstop.
   - `elevated`: the companion gently checks in directly and offers resources inline.
   - `acute` (self-harm or suicide intent, harm to others, abuse, medical emergency): the UI moves into the calm "concerned" state, and a **resource panel** slides up with region-aware hotlines (US: 988 call/text; UK: Samaritans 116 123; international list fallback) and a one-tap call/text. The companion stays present and supportive. It does not abruptly end the conversation.
4. Every `elevated`/`acute` event is logged to `safety_events` (metadata only) for review.
5. **Safety eval set** (§9) must pass 100% before every release.
6. **Naming / legal:** several US states now restrict marketing AI as "therapy" (for example, Illinois's 2025 law on AI in therapy, and similar rules in Nevada and Utah). **Recommendation:** keep "AI Therapist" as an internal/project name only. The public product name and copy should say *companion / support / reflection*, never *therapy / therapist / treatment*. This needs client sign-off and legal review.

---

## 9. Quality & testing

- **Unit/component:** Vitest + React Testing Library.
- **E2E:** Playwright (landing → consent → text session → reflection card).
- **Conversation evals:** a set of ~100 scripted user scenarios (venting, work stress, grief, loneliness, relationship conflict) graded on empathy, brevity, one-question-at-a-time, and no advice overreach.
- **Safety evals:** ~50 scenarios across risk levels, including indirect phrasing. They are graded on correct `risk_level` and resources shown.
- **Performance:** voice latency budget tracked in CI on a synthetic run, and the orb holds 60 fps on a mid-range phone.
- **Accessibility:** WCAG 2.2 AA, full keyboard flow, captions always available, reduced-motion mode, screen-reader labels on all orb states.

---

## 10. Milestones

| # | Milestone | Outcome |
|---|---|---|
| M0 | Scaffold | Next.js + Tailwind + Supabase wired, CI, preview deploys, design tokens |
| M1 | Visual core | Presence orb (all states), sky background, captions UI, Breathe mode, using mocked data |
| M2 | Text conversation | Claude streaming in Write mode, tone → orb color, safety layer v1 |
| M3 | Voice | STT/TTS pipeline, VAD, barge-in, orb reacting to real audio |
| M4 | Reflection | Reflection cards, Inner Weather, history strip |
| M5 | Accounts & memory | Auth, guest → account migration, default-on memory + "What I remember" page, export/delete |
| M6 | Launch hardening | Evals passing, a11y audit, privacy/legal copy, landing page polish |
| — | v1.1 | Constellations, card export, reminders, voice choice |

---

## 11. Open questions for the client

1. **Paid accounts:** free vs paid split, pricing, trial, and which features (if any) are gated. *The architecture is entitlement-ready (a `plan` field on profiles plus feature flags), so this can slot in at any milestone.*
2. **Public product name and domain.** See the naming risk in §8.6.
3. **Launch regions.** These affect hotline lists, privacy law (GDPR/UK GDPR), and the age gate.
4. **Brand assets:** is there an existing logo or brand, or do we create one?
5. **Clinical advisor:** will a licensed professional review the prompts and safety flows? Strongly recommended before launch.
6. **Voice:** is one default voice fine, or does the client want to pick it?

---

## 12. As built (implementation notes)

Where the build differs from the plan above, and why:

| Spec | As built | Why |
|---|---|---|
| Public name TBD | Placeholder **"Haven"** in `src/lib/brand.ts` | Keeps "therapy/therapist" out of public copy (§8.6) until the client decides. |
| Orb via react-three-fiber | A raw WebGL fragment shader (`src/components/presence`) | One full-screen quad doesn't need a 3D library; smaller and faster. A CSS fallback covers reduced motion and devices without WebGL. |
| Framer Motion for UI | CSS transitions with motion tokens | Fewer dependencies; every duration and easing lives in `tokens.css` for the redesign. |
| Realtime streaming STT | ElevenLabs Scribe **per utterance** (voice activity detection decides when you've finished), with the browser Web Speech API as fallback | Simpler and robust. Realtime streaming can replace `ServerRecognizer` later without UI changes. |
| Classifier model | Claude (`claude-opus-5-5`) runs the reply, the per-turn analysis, and the end-of-session reflection | Analysis runs in parallel with the reply, so it doesn't add latency. A cheaper model can be measured against `evals/` later. |
| Thought Constellations, card export (v1.1) | **Built** | — |
| Daily reminders, multi-language, PostHog, Sentry | **Not built yet** | They need client decisions and keys. See docs/DEPLOY.md. |
| — | **Demo mode** when keys are missing | So the whole experience can be reviewed before any accounts or keys exist. |
| Fraunces + Inter, twilight indigo | **Redesign 3a "Sage & lamplight"**: Geist + Instrument Serif, sage and cream, three-membrane orb, canvas skies | The designer's handoff. See docs/DESIGN_HANDOFF.md §10. |
| CSS particle skies | A canvas renderer (`src/components/sky/skyRenderer.ts`) | It ports the designer's reference and keeps captions at AA over every sky. |
| Card made only when its page opened | **Card starts on End**, and the app finishes any missed card on the next visit (conversations left open count as finished after 2 hours) | Product review: a closed tab must not lose the card or the memory update. |
| — | **Product review round (Oct 2026), logic built, UI waiting on design:** starters, support style (listen / understand / act), slow-reply state, card feedback and editing, "what I'll remember from this", choosing a conversation's sky | See `docs/design-handoff/round-2/HANDOFF.md`. The companion prompt (v2026-10-28.1) now responds to specifics, offers its reads as questions, accepts correction, avoids repeated validation, and follows the kind of support asked for. |
