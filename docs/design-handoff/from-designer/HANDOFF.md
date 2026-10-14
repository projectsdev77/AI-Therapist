# Haven: visual redesign handoff (direction 3a "Sage & lamplight")

This answers DESIGN_HANDOFF.md §9 "What I need back" and §8 "Open questions".
Scope: **visual only**. Everything that changes behavior is listed in §6.
Every visual value lives in `tokens.css` under the existing variable names. New tokens are marked `NEW`.

## 0. Files in this bundle

| File | What it is |
|---|---|
| `tokens.css` | **Drop-in replacement** for `src/styles/tokens.css`. Contains Twilight (dark, default) and Dawn (light), the OS preference, and the `data-theme` override |
| `Haven Screens.dc.html` | Every §4 screen at 390px and 1280px, in Twilight and Dawn (68 frames) |
| `Haven App.dc.html` | The single source behind every frame. Set the `screen` and `desktop` props to view one screen |
| `Haven Components.dc.html` / `Haven Kit.dc.html` | Every §5 component state, in both themes (this replaces `/lab`) |
| `Haven Spec.dc.html` | Motion spec, PRESENCE_STATES, behavior changes, assets, §8 answers, and the 1080×1920 share card |
| `Weather Review.dc.html` | All 6 skies × 2 themes with captions on top (approved) |
| `Orb.dc.html` | **Reference renderer** for the orb: the new PRESENCE_STATES and how the parameters are interpolated |
| `Sky.dc.html` | **Reference renderer** for Inner Weather, drawing all 6 weathers in both themes |
| `TopBar.dc.html` | Top bar with Get help, used on every screen |
| `assets/` | Logo mark, wordmarks, app icon, maskable icon, 27 icons, 6 weather glyphs (SVG) |

Open any `.dc.html` file directly in a browser. The orb and sky in them are canvas-2D reference implementations: port their parameters and composition into the existing WebGL shader (`src/components/presence/shader.ts`). Do not ship the canvas code.

---

## 1. Design direction

A quiet room at dusk, with a lamp on. Cream and sage instead of navy and violet. The companion speaks in a light grotesque, and the person's own words are set in a serif italic. That change of voice replaces chat bubbles and speaker names.

- **Fonts:** Geist 300/400/500 (`--font-display`, `--font-body`) and Instrument Serif Italic (`--font-accent`, NEW). Both are free on Google Fonts. Load `Geist:wght@300;400;500` and `Instrument+Serif:ital@0;1` with `display=swap`.
- **Who uses each font:**
  - Companion captions: Geist 300, 23px, line-height 1.38, letter-spacing −0.01em.
  - Person captions: Instrument Serif Italic, 20px, line-height 1.35, `--color-text-muted`.
  - Headings: Geist 300, 34px, −0.025em, with one accent word in Instrument Serif Italic at +4px. For example: "Your *skies*", "What I *remember*", "Before we *begin*".
  - UI text: Geist 400 at 16px, labels and buttons at 500, meta text at 14px.
- **Surfaces:**
  - The base is `--color-bg`.
  - A soft mesh of three radial washes (`--mesh-a/b/c`, NEW) goes over the sky on every screen except Patterns. The ready-made composite is `--mesh-bg`.
  - Composer and controls sit on a sage band (`--color-band`, NEW) with top corners at `--radius-lg`.
  - Cards use `--color-surface` with `--shadow-soft` (NEW; `none` in Twilight).
- **Accent:** a soft green (`--color-accent`) fills primary buttons. `--color-accent-strong` is the text-safe accent for links and labels.
- **Care:** apricot, never red. `--color-care` is used for text, `--color-care-surface` for the panel, and `--color-care-strong`/`--color-on-care` (NEW) for the filled Call button.
- **Focus:** a 2px `--color-focus` outline, offset 3px, on every interactive element.

## 2. Tokens (§9.1)

`tokens.css` is complete and authoritative. Summary of what changed:

- **Every existing variable is kept and retuned:** color, the 8 tones, the 12 sky stops, radius and motion.
- **New tokens:**
  - Fonts: `--font-accent`, `--weight-display/body/strong`
  - Surfaces and care: `--color-band`, `--color-care-strong`, `--color-on-care`
  - Orb: `--orb-core`, `--orb-membrane`, `--orb-glow-alpha`, `--orb-blend` (read by Presence at runtime)
  - Shadows: `--shadow-soft`, `--shadow-raised`
  - Motion: `--motion-sky` (2400ms), `--motion-sheet` (560ms), `--ease-settle`
  - Mesh: `--mesh-a/b/c`, `--mesh-bg`
  - Patterns: `--night-*` (6 tokens). The Patterns constellation is always a night garden, in both themes.
- **Theme selection:** unchanged. `:root` is Twilight. `prefers-color-scheme: light` gives Dawn unless `data-theme="dark"` is set. `[data-theme="light"]` forces Dawn.

### Contrast (measured, WCAG 2.2 AA)
- **Token pairs:** every text token (`text`, `text-muted`, `text-faint`, `accent-strong`, `care`) passes 4.5:1, in both themes, on each of these:
  - `bg`, `band`, `surface`, `care-surface`
  - all 12 sky stops
- **Text on fills:**
  - `on-accent` on `accent`: 11.1 (Twilight) and 10.9 (Dawn)
  - `on-care` on `care-strong`: 9.5 and 6.9
  - Night labels on the night sky: at least 11:1
- **Captions over rendered skies:** I measured the actual drawn pixels in the caption area (bottom 40% of the sky) for all 6 weathers × 2 themes. Text, muted and faint all pass at the worst pixel. The tightest case is faint text on the Dawn storm sky, at about 4.5.
- **Rendering rules that keep this true (port them):**
  - Rain alpha fades by 88% across 45–60% of the sky height, so captions never sit on streaks.
  - Twilight's breaking glow is capped at 0.06 alpha and its rays at 0.025.
  - The previous caption (age 1) is full-opacity `--color-text-muted`, not 40% opacity.
- **Not measured:** the mesh washes add a slight tint on top of the sky. The margins are wide, but run axe in CI on `/talk` with each weather to confirm.

## 3. Screens (§9.2)

All screens are in `Haven Screens.dc.html`. Each row shows 390 Twilight, 390 Dawn, 1280 Twilight and 1280 Dawn.

| # | Screen | Route / state | Notes |
|---|---|---|---|
| 01 | Home, first visit | `/` | Orb, then the headline. **Talk and Write are equal**: same size, same fill, side by side. Below that, three value cards and the footer disclaimer (new copy, §6) |
| 02 | Consent | `/` sheet | A bottom sheet on mobile, a centered panel on desktop. Contains a remember switch, an 18+ check and "Let's begin" |
| 03 | Home, returning | `/` | Drizzle sky, the weather line, "Good evening, Maya.", equal Talk/Write, and a "Pick up from here" card |
| 04 | Talk, writing | `/talk?mode=text` | Orb, then captions (age 2 decorative, age 1 person, age 0 companion with streaming dot), then the band with the composer and Breathe/Transcript/End |
| 05 | Talk, voice off | `/talk` | "I'll say hello first." A 64px "Tap to start talking" button (an iOS gesture), plus "Write instead" |
| 06 | Voice, listening | `/talk` | Status "I'm listening", "Speak anytime to interrupt", and Mute / Write / End |
| 07 | Safety, acute | `/talk` | Orb `concerned`. The panel opens on its own between the captions and the composer. **Nothing covers the composer** |
| 08 | Safety, elevated | `/talk` | Storm sky and a "Support options" pill under the captions |
| 09 | Get help | sheet | A region picker and three lines, each with a filled Call button and an outlined Text button |
| 10 | Breathe | `/breathe` | The orb paces the breath, with a phase label and count, pattern radios and a haptics switch |
| 11 | Reflection | `/reflection/[id]` | The sky header, title, quotes, summary, next step, chips, then actions. The guest "Want to keep this?" prompt sits below |
| 12 | Your skies | `/skies` | A 30-day strip of tiles, then conversations grouped by day |
| 13 | Your patterns | `/patterns` | A night garden. Each star's size and glow follow how often the theme comes up. Selecting one opens its list in a sheet |
| 14 | What I remember | `/memory` | The remember switch, an "In short" summary, items by category with Edit/Forget, edit mode, and Add |
| 15 | Settings | `/settings` | Grouped rows using the designed switch, the theme radio, and Ambient sound (proposal) |
| 16 | Menu | sheet | A bottom sheet on mobile, a 396px panel at the top right on desktop |
| — | Sign in | `/signin` | Google, then a magic link |

**Desktop at 1280:** the sky and mesh fill the window. Content sits in a centered column (600–640px; 440px for sign-in). The top bar spans the full width. Sheets become centered panels, and the Menu becomes a right-hand panel. No other layout changes.

**Get help** is in the top bar on every screen, including behind sheets. The scrim starts below the top bar.

## 4. Component states (§9.3)

All of these are in `Haven Components.dc.html`, in both themes:

- **Presence:** idle, listening, thinking, speaking, concerned, breath; the 8 tones; the reduced-motion / no-WebGL fallback, a static gradient from `--orb-core` → tone → transparent at 72%.
- **Inner Weather:** 6 skies with glyph, label and captions.
- **Captions:** age 2, age 1, age 0, and pending (three dots, `role=status`, "Thinking").
- **Voice controls:** off, starting, listening, hearing, transcribing, thinking, speaking, muted, unsupported, error.
- **Crisis panel:**
  - Elevated: collapsed (outlined pill) and expanded ("Not now").
  - Acute: expanded (opens on its own, "I'm safe right now") and collapsed (filled "Talk to someone now").
- **Buttons:** primary, secondary, ghost, care × 44 / 56 / icon-48. Focus ring shown. Pressed state is scale .98.
- **Toggle:** on, off, focused. It's `button role="switch"` with a 52×44 hit area.
- **Composer:** empty (send muted) and typing (grows to 6 lines). Enter sends, Shift+Enter adds a new line.
- **Memory item:** view, edit, and forgotten with Undo.
- **Reflection card:** full, minimal, and sky tile.
- **Empty states:** no skies, no patterns, no memory. Also the demo badge and an inline error ("That didn't send. Your words are still here.").
- **Icons and weather glyphs.**

## 5. Motion (§9.4)

The rule: nothing arrives faster than it would in a dim room. Only direct feedback uses `--motion-fast`. Anything that appears uses `--ease-settle`.

| Transition | Duration | Easing | Notes |
|---|---|---|---|
| Button press / toggle thumb | `--motion-fast` 180ms | `--ease-calm` | Press scale .98 |
| Hover, focus, color | `--motion-base` 480ms | `--ease-calm` | The focus ring appears instantly |
| Caption ages 0→1→2→gone | `--motion-slow` 1000ms | `--ease-calm` | Age 2: −6px, 1.2px blur, opacity .22, then out over 1600ms |
| New caption | 1000ms | `--ease-settle` | From 0 opacity, +8px. Streaming text has no per-word effects |
| Streaming / pending dot | 1600ms loop | `--ease-breath` | Opacity .3↔1, scale .8↔1. The three pending dots are staggered by 250ms |
| Orb state change | ≈1200ms to 95% | exponential, k = 2.5/s | Every parameter eases toward its target each frame, so states never pop |
| Orb tone | `--motion-tone-shift` 4000ms | `--ease-calm` | Unchanged |
| Sky weather change | `--motion-sky` 2400ms | `--ease-calm` | Particles cross at the midpoint, and rain arrives last |
| Sheets | `--motion-sheet` 560ms | `--ease-settle` | Rise 24px and fade in. Scrim 480ms. Close 420ms with `--ease-calm` |
| Crisis panel expand | 1000ms | `--ease-settle` | Height and opacity. Captions move up and the composer stays put |
| Route change | 480ms | `--ease-calm` | Cross-fade. The sky persists across routes |
| Breath pacer | per pattern | `--ease-breath` | Calm 4·6, Box 4·4·4·4 (holds are flat), 4·7·8. Haptic at each phase start |

**Reduced motion:**
- No ambient motion anywhere.
- The orb is the static gradient fallback; the tone still cross-fades, as color only.
- Skies render one still frame.
- Captions cross-fade over 480ms with no movement or blur.
- Dots are hidden. The status text carries the state.
- Breathe shows the phase label and countdown only.

### PRESENCE_STATES (new values)

The orb is now three translucent membranes (outer, middle, inner) around a lit core. Each membrane's edge is displaced by noise at a different phase, so the layers slide past each other.

| state | scale | wobble | swirl | ripple | glow | breathAmp | breathPeriod | spread (NEW) | levelGain (NEW) |
|---|---|---|---|---|---|---|---|---|---|
| idle | 1.00 | 0.050 | 0.60 | 0.0 | 1.00 | 0.035 | 10 | 1.00 | 0.0 |
| listening | 1.04 | 0.060 | 0.70 | 0.8 | 1.10 | 0.015 | 10 | 1.08 | 0.9 |
| thinking | 0.92 | 0.035 | 1.60 | 0.0 | 0.90 | 0.020 | 6 | 0.90 | 0.0 |
| speaking | 1.02 | 0.055 | 0.80 | 0.6 | 1.15 | 0.010 | 10 | 1.10 | 1.0 |
| concerned | 0.97 | 0.020 | 0.30 | 0.0 | 1.20 | 0.030 | 12 | 1.15 | 0.3 |
| breath | 1.00 | 0.025 | 0.40 | 0.0 | 1.05 | 0.000 | pattern | 1.05 | 0.0 |

Shader notes. `Orb.dc.html` is the exact reference.

**Composition**
- Base radius is R = 0.27 × the canvas size, multiplied by `scale × breath × (1 + 0.05·level)`.
- Membranes sit at 1.22·spread, 1.08·spread and 0.94 of R. Their alphas are .22 (`--orb-membrane`), .38 (tone) and .55 (tone).
- Phases are 0, 2.1 and 4.3. Speeds are 1.00×, 1.17× and 1.34× of swirl.
- The edge noise is `(sin(3a+0.7t+φ) + 0.6·sin(5a−0.9t+2φ) + 0.35·sin(8a+1.3t+φ)) / 1.95`, scaled by `wobble + 0.04·level`.
- Ripple is `ripple × level × 0.02 × sin(11a − 5t + φ)`, applied to the membranes only.
- The core is a radial gradient from `--orb-core` (.95) to transparent tone at 0.85R, offset (−0.12R, −0.15R).
- Glow is the tone at `--orb-glow-alpha × glow × (1 + 0.5·level)`, out to the canvas edge.

**Audio level**
- Smoothed with a fast attack (18/s) and a slow release (4/s), multiplied by `levelGain`.

**Theme blending**
- Twilight blends membranes with `screen`. Dawn uses `source-over`. Read `--orb-blend` and `--orb-glow-alpha` from CSS.

**Breath state**
- Size follows the pacer, from 0.78 to 1.16.

**Concerned**
- Tone is forced to `--tone-concerned`. It never flashes or turns red.

### Inner Weather

`Sky.dc.html` is the reference. Each sky is a gradient from `--sky-*-top` to `--sky-*-bottom`, plus the per-weather elements below.

| Weather | Twilight | Dawn |
|---|---|---|
| clear | Glow top right and 46 twinkling stars | Mint-blue sky, a low sun at (80%, 20%) with a warm halo, and 3 blurred cirrus strands drifting 4–6px/s |
| haze | 5 drifting haze blobs | 5 drifting haze blobs |
| drizzle | 50 hairline drops | 50 hairline drops |
| storm | 120 drops and a darkened top | 120 drops and a darkened top |
| breaking | Low horizon glow, 7 faint rays | Warm horizon glow, 7 soft rays, 4 drifting two-tone clouds |
| unknown ("Quiet") | 18 stars | A pale moon at (22%, 30%), a cool wash top right, 2 mist bands |

- **Tiles** (Skies strip, reflection header, share card) render one static frame with no fade on the rain.
- **Glyphs** in `assets/weather/` carry the label wherever the sky is too small to read.

## 6. Behavior changes (§9.6)

Each of these changes something beyond looks. Items marked **proposal** need your approval before they're built.

1. **Previous caption (age 1) at full opacity.** It was 40% opacity, which fails AA. It's now `--color-text-muted` at full opacity. Age 2 becomes `aria-hidden`, since the transcript keeps the text. *(accessibility)*
2. **Designed switch.** The native checkbox becomes `button role="switch" aria-checked` with a 52×44 hit area. *(component)*
3. **Home footer copy.** The old "not a therapist" wording broke the §2 copy rule. The new line is: "Haven is an AI companion for everyday reflection. It isn't a clinician or an emergency service. If you're in danger, call your local emergency number." *(copy)*
4. **Pending reply indicator.** Three pulsing dots with `role="status"` and the label "Thinking", shown before the first token arrives. *(small state)*
5. **Desktop menu.** A right-hand panel instead of a bottom sheet. Mobile is unchanged. *(layout)*
6. **Acute panel after "I'm safe right now".** It collapses to a filled "Talk to someone now" pill, not the outlined elevated pill. *(proposal)*
7. **Rain fades behind captions.** Talk screens only, needed for contrast. *(rendering)*
8. **Ambient sound setting.** New and off by default. See §7. *(proposal, new)*
9. **1080×1920 Stories share card.** A new export size, with the quote off by default. See §7. *(proposal, new)*

Nothing else changes: routes, states, safety triggers, data, and the transcript as a secondary view all stay as they are.

## 7. Open questions (§8)

### 8.1 Name and wordmark
- Keep a lowercase Instrument Serif Italic wordmark with the orb mark, whatever the name.
- The wordmark SVG uses live `<text>`, so a rename is a one-string change. **Outline it before you ship it as a static asset.**
- Candidates: **haven** (keep), **lull**, **nook**, **stillwater**, **ember**. None have been checked for trademarks or domains.

### 8.2 Orb character
- More character, but quiet: three layered membranes and an inner light. No particles, eyes or faces.
- The layers drifting out of phase is what reads as alive. The core shows the state: it dims and tightens while thinking, and warms and stills when concerned.
- In Dawn it reads as sunlight on paper, not a glowing ball.

### 8.3 Weather illustration style
- Atmosphere, not illustration: low-contrast gradient fields with fine particles, generated at runtime. No raster art.
- Sky colors stay close to surface tones so captions keep AA on every sky.

### 8.4 Ambient sound
- Yes, off by default, under Settings → Conversations.
- Three loops with no audible seams: soft rain, room tone, low hum.
- Ducks −18 dB while either side speaks and fades in over 4s.
- Follows the weather only if the person turns on "Match my sky".
- Never plays during Breathe or while the crisis panel is open.

### 8.5 Share card, 1080×1920
A separate layout from the current 1080×1350 one.
- **Layout:**
  - Sky and orb fill the top 40%, drawn from the person's actual weather and last tone.
  - Below that: title (Geist 300, 92px), one quote (Instrument Serif Italic, 70px), and the next step on a band.
  - The date line and wordmark stay inside the Stories safe area, about 250px from the top and bottom.
- **Privacy:**
  - The quote starts **off**; one tap adds it.
  - Theme chips and memory never appear.
- **Rendering:**
  - Follows the current theme.
  - Drawn from tokens in `cardImage.ts`, with the orb as one static shader frame.
- **The 1080×1350 feed card** keeps its layout, restyled with the new tokens.

## 8. Assets (§9.5)

| Asset | Files |
|---|---|
| Logo mark | `assets/logo-mark.svg` (Twilight), `assets/logo-mark-dawn.svg` |
| Wordmark | `assets/wordmark-twilight.svg`, `assets/wordmark-dawn.svg` (live text, outline before shipping) |
| App icon | `assets/app-icon.svg`: 1024px, rounded square at rx 228, for iOS, favicon and desktop |
| Maskable icon | `assets/app-icon-maskable.svg`: full-bleed, mark inside the 80% safe zone. Use with `"purpose": "maskable"` |
| Icons (27) | `assets/icons/*.svg`: mic, mic-off, write, send, breathe, transcript, menu, close, back, chevron, chevron-down, help, globe, phone, message, trash, download, home, skies, patterns, memory, settings, plus, check, end, sound, share |
| Weather glyphs (6) | `assets/weather/*.svg`: clear, haze, drizzle, storm, breaking, unknown |

All icons are drawn on a 24px grid with a 1.6px stroke, round caps and joins, and `currentColor`. Mark decorative uses `aria-hidden`. Every icon-only button has an `aria-label`.

## 9. Accessibility checklist (verified in the mockups)

- **Contrast:** AA for every text token on every ground and sky in both themes (§2).
- **Touch targets:** every button and link has a hit area of at least 44×44px. The primary composer controls are 44–48px, and the voice start button is 64px.
- **Get help:** in the top bar on every screen, never covered by a scrim.
- **Safety UI:** never red, never modal. The crisis panel never covers the composer or captions.
- **Live regions:** captions use `aria-live="polite"`. Voice status and the pending indicator use `role="status"`. Age 2 is `aria-hidden`.
- **Reduced motion:** covered everywhere (§5).
- **Public copy:** contains none of "therapy", "therapist" or "treatment".
- **Talk and Write:** equal on both home screens.

## 10. Implementation order (suggested)

1. Swap in `tokens.css` and load the fonts. Most screens restyle from this step alone.
2. Port PRESENCE_STATES and the membrane composition into the shader, and read the `--orb-*` tokens.
3. Port the sky renderer, including the rain fade.
4. Captions: the new type pairing and the age-1 opacity fix.
5. Components: switch, composer, crisis panel states, sheets and the desktop menu.
6. Reflection card, Skies, Patterns night garden, Memory and Settings.
7. Assets and manifest icons.
8. The proposals (§6 items 6, 8 and 9), once approved.
