# Design handoff: Haven (AI companion)

> **Status (2026-10-14):** the designer's answer, direction 3a "Sage & lamplight", is in
> [`design-handoff/from-designer/`](design-handoff/from-designer/HANDOFF.md) and is **implemented**.
> See [§10](#10-implementation-notes) for deviations and open proposals. The screenshots in
> `design-handoff/screens/` show the build *before* the redesign.

**For:** Claude Design (or any designer) redesigning the visual layer.
**From:** the engineering build. Everything described here works today in both themes, on mobile and desktop.
**Goal:** redesign how it **looks and moves**, not how it works. When you return the formats in [§9](#9-what-i-need-back), I can implement them directly.

Screenshots of every screen and state are in [`design-handoff/screens/`](design-handoff/screens) (light and dark, mobile, plus key desktop views). The live style guide is at **`/lab`** in the running app, with every orb state, tone, weather, and theme on one page.

---

## 1. The product in one paragraph

A voice-first companion for everyday emotional support and self-reflection. The client's one brief was: *"stay away from just chatbot — how can we visually stand out?"* So there are **no chat bubbles anywhere**:
- A living **orb** (the Presence) is the companion's face.
- The conversation appears as fading **film captions**.
- Each session becomes a **sky** (Inner Weather) and a typeset **reflection card**.
- Recurring themes form a **constellation**.

The companion remembers the person between sessions, like a counselor's notes, and everything remembered is visible and editable. It is **not therapy** and must never look clinical, corporate, or alarming.

**Name:** "Haven" is a **placeholder**. The client hasn't chosen a name. Please design a wordmark that's easy to swap, or propose names. Public copy must avoid the words *therapy*, *therapist*, and *treatment* (a legal constraint).

## 2. Non-negotiables (and why)

| Constraint | Why |
|---|---|
| **No chat bubbles.** Conversation is shown as captions; the full transcript is a secondary sheet. | The core differentiator the client asked for. |
| **The orb stays a real-time shader** that reacts to sound (mic level while listening, voice level while speaking). You can redesign its shape language, colors, glow, and motion character, but it must stay generative and audio-reactive, not a looping video or Lottie. | It is "alive" because it responds to the person's actual voice. |
| **"Get help" is visible on every screen**, top right, in the *care* color. | Safety. Never hide it in a menu. |
| **Safety UI is warm and calm, never alarm red.** The crisis panel and "concerned" orb state must feel like someone sitting closer, not a siren. | People in crisis need calm. |
| **The crisis panel never blocks the conversation.** It is non-modal and sits between the captions and the input. | The companion stays present; the person can keep talking. |
| **Captions must stay readable over any sky**, in both themes. | Accessibility, and it's the main content. |
| **WCAG 2.2 AA contrast.** Automated axe checks run in CI and will fail the build. | Accessibility. |
| **Motion is slow and eased.** Nothing snaps; durations of 400ms or more except direct feedback. Everything must have a `prefers-reduced-motion` version (the orb already falls back to a static gradient). | Calm is the product. |
| **Talk and Write are equal choices** on the home screen. | The client wants text to be a full option, not a fallback. |
| **Touch targets of at least 44px.** Phone-first layout with a 16px side gutter. | Most use will be on phones, often at night. |
| **Two themes:** *Twilight* (dark, default) and *Dawn* (light). Both are first-class. | Many sessions happen at night. |

## 3. Design system today

**Every visual value lives in one file:** [`src/styles/tokens.css`](../src/styles/tokens.css). Tailwind utilities map onto these variables. The orb and the card image exporter read them at runtime, so **changing a token restyles everything, including the WebGL orb**.

### Tokens (current values: Twilight / Dawn)

**Surface and text**

| Token | Twilight | Dawn | Used for |
|---|---|---|---|
| `--color-bg` | `#0e1024` | `#fbf5ef` | Page background |
| `--color-bg-deep` | `#070816` | `#f3e9e1` | Deeper areas |
| `--color-surface` | `rgba(255,255,255,.06)` | `rgba(60,40,90,.05)` | Cards and inputs (translucent over skies) |
| `--color-surface-strong` | `rgba(255,255,255,.11)` | `rgba(60,40,90,.10)` | Hover, selected |
| `--color-border` | `rgba(255,255,255,.12)` | `rgba(60,40,90,.14)` | Hairlines |
| `--color-text` | `#eef0ff` | `#2a2140` | Primary text |
| `--color-text-muted` | `#a9adcf` | `#5e5577` | Secondary text |
| `--color-text-faint` | `#8d92bd` | `#6a6085` | Labels and meta (still AA) |
| `--color-accent` / `-strong` | `#b8a6ff` / `#d7ccff` | `#6d55c9` / `#4f3aa3` | Primary buttons, focus of attention |
| `--color-on-accent` | `#160f33` | `#ffffff` | Text on accent |
| `--color-focus` | `#ffd9a8` | `#c86a2a` | Keyboard focus ring |
| `--color-care` / `--color-care-surface` | `#ffb98a` / 12% | `#97441a` / 10% | Get help, crisis UI |

**Tone palette.** The orb tints toward the person's current tone and cross-fades over 4s.

| Tone | Twilight | Dawn |
|---|---|---|
| `--tone-neutral` | `#9d9ce8` | `#8a86d8` |
| `--tone-calm` | `#7fc8e8` | `#6ab4d8` |
| `--tone-heavy` | `#6f6fb8` | `#7b78b5` |
| `--tone-anxious` | `#c79be8` | `#b98ad8` |
| `--tone-warm` | `#ffb38a` | `#f2a275` |
| `--tone-hopeful` | `#9fe0b5` | `#7fcf9c` |
| `--tone-frustrated` | `#e88f8f` | `#df8282` |
| `--tone-concerned` (safety state) | `#ffc59e` | `#f4b089` |

**Inner Weather skies.** Each sky is a top-to-bottom gradient pair, plus `--sky-glow`: `clear`, `haze`, `drizzle`, `storm`, `breaking` (sun breaking through), and `unknown` (no sessions yet / quiet). See `tokens.css` for all 12 stops per theme.

**Constellation** (always a night sky, in both themes): `--night-top #1a1d44`, `--night-bottom #070816`, `--night-star`, `--night-glow`, `--night-line`, `--night-label`.

**Type:** `--font-display` is Fraunces (serif: headings, captions from the companion, cards). `--font-body` is Inter (UI, the person's own words in captions, set in italic).

**Radius:** `--radius-sm 8px`, `--radius-md 14px`, `--radius-lg 22px`, `--radius-pill 999px`.

**Motion:** `--motion-fast 160ms`, `--motion-base 420ms`, `--motion-slow 900ms`, `--motion-tone-shift 4000ms`, `--ease-calm cubic-bezier(.22,.61,.36,1)`, `--ease-breath cubic-bezier(.45,0,.55,1)`, `--breath-idle-seconds 10`.

## 4. Screens

Files are named `NN-name-{light|dark}[-desktop].png`.

| # | Route | Purpose | Notes |
|---|---|---|---|
| 01 | `/` (first visit) | Orb breathing, "Hello. I'm here to listen.", **Talk** / **Write**, three value cards, "not a therapist" footer | Marketing and app in one. No separate landing page. |
| 02 | Consent sheet | One-time: not therapy, not for emergencies (with local crisis line), **memory on by default**, privacy, 18+ checkbox | Bottom sheet on mobile, centered on desktop. |
| 03 | `/` (returning) | Greeting by time and name, sky shows today's weather, orb tinted by last tone, "Last time" card | |
| 04 | `/talk?mode=text` | Orb, captions, composer, End, Get help, Breathe, transcript | The core screen. |
| 05 | `/talk?mode=voice` | "Tap to start talking" (needed so the greeting can be heard on iOS) | |
| 06 | Voice listening | Mute, live status ("I'm listening" / "Thinking…" / "Speak anytime to interrupt"), switch to Write | |
| 07 | Safety: acute | Orb in *concerned* state, quiet sky, support panel auto-opens with Call/Text | |
| 08 | Safety: elevated | "Support options" pill offered under the captions | |
| 09 | Get help sheet | Region-aware crisis lines, region picker | |
| 10 | `/breathe` | Orb as a breath pacer, phase label and countdown, pattern picker, haptics | |
| 11 | `/history/[id]` | The reflection card, Save image, Read the conversation, Delete, "Want to keep this?" (guests) | |
| 12 | `/history` "Your skies" | 30-day strip of sky tiles, sessions by day | |
| 13 | `/patterns` "Your patterns" | Constellation; tap a star to list its conversations | |
| 14 | `/memory` "What I remember" | Editable notes summary, facts by category (edit/forget), add your own | Trust is the point of this page. |
| 15 | `/settings` | Name, memory switch, voice, theme, region, account, export, delete everything | |
| 16 | Menu | Home, Your skies, Your patterns, What I remember, Breathe, Settings, (Sign in) | |
| 17 | `/lab` | Style guide with every orb state, tone, weather, and theme | Use it to review your changes live. |
| — | `/signin` | Google + email magic link | Not screenshotted (needs Supabase); same shell as Settings. |
| — | Saved card image | 1080×1350 PNG drawn from tokens | `src/lib/reflection/cardImage.ts` |

## 5. Components and their states

### Presence (the orb), `src/components/presence/`
A WebGL fragment shader: a soft blob whose edge is perturbed by noise, with an interior swirl between the tone color and `--color-accent-strong`, plus a glow.

| State | When | Current motion character |
|---|---|---|
| `idle` | Resting, home | Breathes ±4% every 10s; slow wobble |
| `listening` | Mic on / person typing | Slightly larger; ripples driven by mic level |
| `thinking` | Waiting for a reply | Contracts to 90%; interior swirls faster |
| `speaking` | Reply streaming or being spoken | Edge moves with the voice level |
| `concerned` | Risk elevated or acute | Settles, very little wobble, warm `--tone-concerned` |
| *(breath)* | Breathe mode | Size follows the breath (78%–116%) |

Parameters per state are in `PRESENCE_STATES` (`Presence.tsx`): scale, wobble, swirl, ripple, glow, breath amplitude, and period. **Give me new values for this table**, or describe the motion, and I'll tune the shader. Reduced motion and no-WebGL fall back to a static radial gradient in the tone color.

### Captions, `src/components/captions/`
The last three lines: current (`data-age=0`, full), previous (`1`, 40% opacity, slightly smaller), leaving (`2`, fades, blurs, and moves up). The companion's lines are serif; the person's are sans italic and muted. A dot pulses while text streams in.

### Sky, `src/components/sky/`
Cross-fades between weathers over 2.4s.
- **Particles:** stars (clear, unknown), drifting haze blobs, rain (drizzle, and heavier for storm), and a rising horizon glow (breaking).
- **Variants:** `full` (page background) and `tile` (thumbnails in history, the card header).
- **Weather illustration** is an open area for you to redesign, as long as it stays generative CSS/canvas, not big images.

### Reflection card, `src/components/reflection/ReflectionCard.tsx`
Sky header with date and weather label, then the title, 1–3 verbatim quotes, an insight, an optional "A small next step", and theme chips. The saved image version mirrors it.

### Safety, `src/components/safety/`
- **CrisisPanel:** collapsed (a "Support options" pill) and expanded. Its copy depends on the risk level: *acute* reads "Please reach out to someone now" with an "I'm safe right now" button; *elevated* reads "You don't have to carry this alone" with a "Not now" button.
- **HelpSheet:** the full list of crisis lines plus a region picker.
- **CrisisResources:** a card per line with Call (filled care button) and Text (outlined).

### Voice controls, `src/components/talk/VoiceControls.tsx`
States: `off` (Tap to start talking / Write instead), `starting`, `listening`, `hearing`, `transcribing`, `thinking`, `speaking`, `muted`, `unsupported` / `error` (message plus "Write instead").

### Others
- **Buttons** (`ui/Button.tsx`): `primary`, `secondary`, `ghost`, `care` × `md`, `lg`, `icon`.
- **Sheet** (`ui/Sheet.tsx`): bottom sheet on mobile, panel on desktop.
- **Text composer:** auto-growing; Enter sends.
- **Top bar and menu.**
- **Memory item:** view and edit modes.
- **Toggle:** currently a native checkbox; a designed switch would be welcome.
- **Small states:** empty states (no sessions, no patterns, no memories), the demo-mode badge, and inline errors (care color).
- **Icons** (`ui/icons.tsx`): 1.6px-stroke line icons. Replace freely; keep the names.

## 6. Voice and copy

Warm, plain, unhurried, and second person. Short sentences. No exclamation marks in support moments. Never clinical ("patient", "symptoms", "session notes") and never therapy words in public copy. The companion talks about "remembering you", "notes", "conversations", "skies", and "patterns".

## 7. Accessibility (must hold after the redesign)

- AA contrast for all text, including over every sky in both themes and the faint/meta text. Axe runs on home, talk, help, reflection, and settings.
- A visible focus ring (`--color-focus`) on everything interactive.
- Reduced motion: no ambient animation. The orb becomes a static gradient; skies stop drifting.
- Captions have a polite live region for screen readers, and orb states have text labels.
- 44px minimum targets; no hover-only affordances.

## 8. Open design questions

1. Logo and wordmark (name TBD), app icon, and social/OG image.
2. Should the orb have more character (e.g. an inner light, layered membranes, particles) or stay minimal?
3. Weather illustration style for skies and tiles.
4. An optional ambient sound bed (rain, room tone; off by default): wanted?
5. The reflection card as a shareable object: is the current layout right for Instagram stories (1080×1920)?

## 9. What I need back

Return these, and I'll implement them without guessing:

1. **Tokens.** An updated `tokens.css`, or a JSON with the **same variable names**, for **both themes**: colors, tone palette, all sky stops, night tokens, fonts (with font names and weights), radii, shadows (add `--shadow-*` tokens if you use shadows), and motion. New tokens are fine; say what they're for.
2. **Screens.** A mockup of every screen in §4, at **390px mobile** and **1280px desktop**, in **both themes**. HTML/CSS I can open is best; a Claude Design project link also works.
3. **Component states.** Every state listed in §5, especially the Presence (all 5 states plus breath), captions (ages 0/1/2 and pending), the reflection card, the crisis panel (both risk levels, collapsed and expanded), and voice controls (each status).
4. **Motion spec.** Durations and easings per transition, and for the orb, a new `PRESENCE_STATES` table or a precise description: size, wobble amount, wobble speed, swirl, glow, and how strongly it reacts to audio.
5. **Assets.** Logo, wordmark, app icon (with a maskable variant), any icons, and weather glyphs, all as **SVG**.
6. **Behavior changes.** Anything that changes behavior, not just looks (e.g. moving the transcript, a new navigation pattern, new screens), listed separately so I don't miss it.

---

## 10. Implementation notes

The designer's handoff ([`from-designer/HANDOFF.md`](design-handoff/from-designer/HANDOFF.md)) is implemented in full, with these notes.

**Ported as specified**
- `tokens.css` dropped in unchanged, except that the font tokens point at the `next/font` variables.
- Geist and Instrument Serif replace Fraunces and Inter.
- Orb: three membranes, new `PRESENCE_STATES`, plus `spread`, `levelGain` and a breath state. The designer's canvas reference is ported to the WebGL shader, which reads `--orb-*` at runtime.
- Skies: the canvas renderer is ported, including the rain fade and the caps on the Twilight breaking glow.
- Every §4 screen, the §5 component states and the motion spec. Sheets rise and settle; captions age with the specified timings; reduced motion is honored everywhere.
- Assets: the 27 icons, logo mark, weather glyphs and app icons. The provenance metadata is stripped from the app copies; the originals are unchanged in `from-designer/`.

**Proposals (§6 of their handoff)**
- **#6, the filled "Talk to someone now" pill after "I'm safe right now":** implemented.
- **#8, ambient sound:** *built*, off by default (Settings → Conversations → Ambient sound; per device). Soft rain, room tone, or a low hum, or "Match my sky". The sounds are generated placeholders until real recordings go in `public/audio/` (see `public/audio/README.md`). It ducks 18 dB whenever either side speaks, sits lower while the mic listens, goes silent during Breathe and when the help panel is open, and runs on its own audio context. The mic's voice detection now tracks a background-noise floor so steady sound never counts as speech.
- **#9, the 1080×1920 Stories card:** implemented, with the quote off by default. The 1080×1350 feed card remains as an option.

**Deviations, and why**
- **Routes:** these stay `/history` and `/history/[id]`. Their screen table says `/skies` and `/reflection/[id]`, but their §6 says routes don't change.
- **Twilight "breaking" on full skies:** the glow and rays are capped lower (0.03 and 0.012). With the mesh on top, faint text measured 3.9:1. After the change, every text token is at least 4.5:1 in the caption column for every sky in both themes. The tightest case is faint text on Twilight breaking, at 4.5.
- **Sign in:** the copy says "The link works once" without "expires in 15 minutes". Supabase's default expiry is different, so I didn't want to promise 15.
- **Home "Last time" card:** it opens the reflection ("See this reflection"), not "Pick up from here". The companion already picks up from memory in the next conversation.
- **What I remember, Add:** a new item goes under *Other*, because their design has no category picker.
- **Wordmark:** the app renders it as live text in the loaded font. Outline the SVG wordmark before using it as a static file.
