# Handoff: Haven: full redesign ("Deep lagoon")

## Overview
Haven is a calm AI companion. People talk out loud or write to untangle a thought, get through a hard moment, or check in with themselves. Each conversation ends in a reflection card with a "sky" (a mood-weather colour). The app also has a 30-day sky history, a patterns constellation, an editable memory, a guided breathing exercise, and safety support available at all times.

This handoff covers **the whole product**: a 3-section marketing landing page, plus **33 app screens, sheets and states**, each on phone (390 px) and desktop (1280 px). It replaces the earlier "Sage & lamplight" direction (`HANDOFF.md` / `HANDOFF-round-2.md` in the project). **Deep lagoon is now the only theme, and it is dark only. There is no light mode.**

Target repo (from `github.md`): `projectsdev77/AI-Therapist`, branch `main`, Next.js app (`src/app/*/page.tsx`, `src/components/…`).

## About the design files
The files in this bundle are **design references created in HTML**: prototypes that show the intended look and behaviour. They are **not production code to copy directly**. The task is to **recreate these designs in the existing Next.js/React codebase** using its patterns (components in `src/components/`, tokens in `src/styles/tokens.css`).

How to open them: open any `.dc.html` file directly in a browser. `support.js` is the small runtime that renders them. Every frame is driven by one component, `Haven App v2.dc.html`, with the props `screen` and `desktop`. Read that file's logic class (the `renderVals`, `talkVals`, `reflVals`, `listVals` and `sheetVals` methods) for the exact copy and per-state values.

| File | What it is |
|---|---|
| `Haven Site v2.dc.html` | **Start here.** A canvas of every screen and state: old vs new, desktop and phone, each with a UX note. |
| `Haven App v2.dc.html` | The single source component for all 33 app screens. Its `screen` enum lists every state. |
| `Haven Landing v2.dc.html` | The landing page (responsive). |
| `Haven Landing v2 Frames.dc.html` | The landing page at 1280 and 390. |
| `Haven Lagoon.dc.html` | The voice-mode Talk screens, plus the live **Orb states** row. |
| `haven-orb.js` | The orb, as a dependency-free web component. **Port this logic exactly.** |
| `lagoon.css` | Every design token. |
| `SITE-MAP.md` | A checklist of every screen, sheet and state. |
| `reference_old/Haven R2.dc.html` | The previous design, for comparison only. |

## Fidelity
**High-fidelity.** Colours, type, radii, spacing, copy, states and motion are final. Recreate them pixel-perfectly. Where this README and the HTML disagree, the HTML wins for visuals and this README wins for behaviour.

---

## Design tokens (`lagoon.css`, prefix `--lg-`)
Replace the old `tokens.css` values with these. Keep your own variable names if you like, but map them 1:1.

### Colour
| Token | Value | Use |
|---|---|---|
| `--lg-bg` | `linear-gradient(180deg,#15726c 0%,#10565c 30%,#0b2a35 66%,#081822 100%)` | Every app screen and the landing panels |
| `--lg-ink` / `--lg-ink-deep` | `#0b2a35` / `#081822` | Card insets; the area around the landing panels |
| `--lg-text` | `#effcfa` | Main text |
| `--lg-text-muted` | `#b3d4d3` | Secondary text (≥5.3:1 anywhere on the background) |
| `--lg-text-faint` | `#9cc0bf` | Placeholders, timestamps, chevrons |
| `--lg-accent` | `#3fd6cd` | Dots, small highlights |
| `--lg-accent-strong` | `#8ff0e8` | Icon colour, links, "Pick up" |
| `--lg-mic` / `--lg-mic-fg` | `#5fe3da` / `#032a2a` | **Every primary button** and the mic. Aqua always means "do it". |
| `--lg-mic-ring` | `rgba(160,250,240,.24)` | The ring around the mic |
| `--lg-mic-shadow` | `rgba(0,0,0,.22)` | The mic's drop shadow |
| `--lg-care` | `#dccfff` | **Safety only**: Get help, crisis panel, support pill. Lilac always means care. |
| `--lg-care-surface` | `rgba(10,20,50,.32)` | Background behind care elements |
| `--lg-glass` / `--lg-glass-strong` | `rgba(150,240,230,.10)` / `.17` | Glass surfaces (strong = selected or hovered) |
| `--lg-edge-hi` / `--lg-edge-lo` | `rgba(255,255,255,.16)` / `.06` | 1 px borders (hi = surfaces, lo = dividers and inner rows) |
| `--lg-streak-a/b/c` | `rgba(80,230,215,.16)` / `rgba(30,90,170,.26)` / `rgba(40,200,190,.14)` | Background light streaks |
| `--lg-focus` | `#e6f59a` | 2 px focus ring, 3 px offset, on every interactive element |
| Destructive (not a token) | button `#ffb4a8` on text `#3a1410`; outline `rgba(255,180,168,.4)` with text `#ffc4b8` | **Only** Delete reflection and Delete everything |
| Sheet panel (not a token) | `rgba(10,34,44,.97)`, scrim `rgba(3,10,16,.62)` | All sheets and dialogs |

**Sky colours** (cards, skies, dots). Each is `linear-gradient(160deg, A, B)`:
clear `#8ff0e8→#3fd6cd` · haze `#b3d4d3→#5f8f91` · drizzle `#6f9bff→#2a6fd0` · storm `#5b5fb8→#232a66` · breaking ("Rain, then clearing") `#b8a8ff→#6ff0e6` · quiet `#2a5560→#0f2a33`.
The 30-day sky line is a horizontal gradient of each day's B colour, one stop per day at `(i+.5)/30`.

### Background
The `--lg-bg` gradient sits under three blurred streaks, `position:absolute`, with `pointer-events:none`:
1. 140 % × 160 px, left −30 %, top 150 px, `--lg-streak-a`, blur 60 px, rotate −16°
2. 120 % × 160 px, right −40 %, top 46 %, `--lg-streak-b`, blur 64 px, rotate 14°
3. 110 % × 200 px, left −10 %, bottom −90 px, `--lg-streak-c`, blur 70 px

### Type
The only typeface is **Geist** (300/400/500/600). No serif anywhere.
| Role | Size | Weight | Tracking | Line height |
|---|---|---|---|---|
| Landing H1 | clamp(38px, 5.6cqi, 72px) | 600 | −0.045em | 1.04 |
| Screen H1 (Home greeting, desktop page titles) | 30–48px (clamp) / 40px for desktop page titles | 600 | −0.04em | 1.08 |
| Section H2 | clamp(30px, 3.6cqi, 46px) | 600 | −0.04em | 1.08 |
| Sheet title | 24px | 600 | −0.03em | 1.15 |
| Card title | clamp(28px, 2.6cqi, 34px) | 600 | −0.035em | 1.12 |
| Haven caption | 23px (phone) → 30px (desktop) | 500 | −0.02em | 1.3 |
| Your caption | 17–19px, muted | 400 | 0 | 1.5 |
| Previous caption | 15–17px, opacity .28, blur 1px, 2-line clamp | 400 | | |
| Body | 16px | 400 | | 1.5 |
| Row title / secondary | 16px / 14px muted | 400 | | |
| Group label (above lists) | 14px muted | 600 | | |
| Small label (dock) | 12–13px muted | 500 | | |

Use `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs.

### Shape, spacing, motion
- **Radii:** `--lg-radius-sm` 14px (rows, small buttons, inputs) · `--lg-radius-md` 18px (dock buttons, cards, inline panels) · `--lg-radius-lg` 32px (dock, big cards, sheets, landing panels) · `--lg-pill` 999px.
- **Hit targets:** at least **44×44 px** everywhere. Primary buttons are 52–56 px tall. List rows are 52–64 px.
- **Page padding:** 16–20px on phone. Desktop content is centred with a max-width of 640px (memory and settings), 680–720px (privacy, skies, captions), 760px (patterns) or 1040px (reflection, which uses 2 columns).
- **Gaps:** 4 / 6 / 8 / 10 / 12 / 14 / 16 / 22 / 24 / 28 px. Always use flex or grid with `gap`.
- **Glass surface:** `background: var(--lg-glass); border: 1px solid var(--lg-edge-hi); backdrop-filter: blur(14–18px)`.
- **Motion:** `--lg-ease` `cubic-bezier(.4,0,.2,1)`, with `--lg-fast` 160ms (hover and press), `--lg-base` 320ms (sheets, accordions) and `--lg-slow` 640ms (screen transitions).
  - Press: `scale(.96–.97)`.
  - Sheets slide up 320ms; dialogs fade and scale from .98.
  - `prefers-reduced-motion`: stop every animation, including the orb.

---

## Global components (build these first)

1. **Top bar** (`<header>`, a 3-column grid `1fr auto 1fr`, padding `clamp(12px,1.9cqi,24px) clamp(16px,2.5cqi,32px) 0`):
   - **Left:** the Haven logo on Home and on desktop: a 24px orb dot (radial `#1a8c84 → #0b3c44 → #04141a`, ring `0 0 0 2px rgba(111,240,230,.55)`) plus "Haven" at 18/600. Everywhere else on phone it is a 44px glass Back button.
   - **Centre:**
     - Desktop, outside Talk: a glass pill nav with *Talk · Your skies · Patterns · What I remember*. The current item gets `--lg-glass-strong` and `aria-current="page"`.
     - Talk screens: a status pill (7px aqua dot plus *Ready / Listening / Speaking / Thinking / In conversation*), `role="status"`.
     - Phone sub-pages: the page title at 16/600.
   - **Right:**
     - **Get help**, always, on every screen: a lilac pill, 44px, with a heart icon, `aria-haspopup="dialog"`.
     - **Menu**: a 44px glass button with two lines. It is hidden on phone Talk screens.
2. **Dock** (Home, voice Talk): a glass panel, 32px radius, max-width 420px, 3-column grid.
   - **Mic:** a 76px aqua circle that sits 60px above the top of the dock, inside a 116px ring holder with one 1px ring (`--lg-mic-ring`). It has a 12px label under it.
   - **Side buttons:** 52px glass, 18px radius, each with a 12px label under it.
   - **Home:** *Write · Tap to talk · Slow down*.
   - **Voice:** *Mute · mic · End*.
     - Mute is disabled at 45% opacity until the mic is live.
     - The mic shows the mic icon at idle, five 4×22px bars animating `lgBar` 1s with a 0.15s stagger while **Listening** (plus the ring pulsing with `lgPulse` 2.4s), and a pause icon while **Speaking**.
     - Its label reads *Tap to talk / Listening / Tap to interrupt*.
3. **Composer** (Write mode): a glass-strong pill, min-height 60px, 30px radius.
   - Placeholder *"Write what's on your mind"* in `--lg-text-faint`.
   - On the right, a 46px aqua circle: the **mic** when the composer is empty (switch to voice), and **Send** (up arrow) once there is text.
   - With text, the border becomes `rgba(143,240,232,.5)`.
4. **Tools row**: 4 equal buttons, 56px tall, with an 18px icon over a 13px label.
   - Write mode: *Style · Breathe · Transcript · End*.
   - Voice mode: *Write · Style · Breathe · Transcript* (End is in the dock).
   - Style shows a 7px aqua dot when a non-default style is active; its `aria-label` becomes "Reply style: Just listen".
5. **Sheet / dialog shell** (one component for all 9 sheets):
   - **Phone:** a bottom sheet, full width, radius 32px on the top only, padding `10px 20px 34px`, with a 40×4px grabber.
   - **Desktop:** centred, max-width 520px (640px for Transcript), 32px radius, padding 24px.
   - **Menu on desktop:** a right side panel, 380px wide, 12px inset.
   - **Header:** a 24px title, an optional 15px muted subtitle, and an optional 44px round Close button.
   - Scrim `rgba(3,10,16,.62)`, panel `rgba(10,34,44,.97)`, shadow `0 30px 80px rgba(0,0,0,.45)`.
   - Use `role="dialog"`, or `role="alertdialog"` for End and Delete, with `aria-modal`, a focus trap, Esc to close, and focus returned to the trigger.
6. **List row**: a glass row, 52–64px, radius 14px, with the title (16px) and optional muted subtitle (14px) on the left. On the right is one of: a switch, a chevron link with a value, or a small pill button. Inside a grouped card, rows are divided by `1px --lg-edge-lo`.
7. **Switch**: a 44×26px track inside a 52×44px hit area, with a 20px knob. On: `--lg-mic` track and `--lg-mic-fg` knob. Off: transparent track, `1px --lg-text-faint` border, `--lg-text-muted` knob. Use `role="switch"` with `aria-checked`.
8. **Buttons**:
   - **Primary:** aqua fill, `#032a2a` text, 600 weight, pill.
   - **Secondary:** glass-strong fill with an edge-hi border.
   - **Tertiary:** transparent with muted text.
   - **Care:** `--lg-care` fill with `#1b1433` text, or a lilac outline.
   - **Destructive:** see the colour table.
   - Only **one primary button per view**.
9. **Orb** (`<haven-orb size state>`): see the next section.

---

## The orb (`haven-orb.js`). Port it exactly.
The orb is built from DOM layers at a design size of 230px, then scaled to the `size` attribute.
- **Core:** inset 34px, radial `#1a8c84 → #0b3c44 62% → #04141a`, `inset 0 0 30px #04141a`. On top of it sit:
  - a top-left specular highlight,
  - a moving **shade** layer (a radial dark edge),
  - a moving **rim light**.
- **Three rings:** conic gradients masked to a thin annulus `radial-gradient(circle, transparent 56%, #000 59% 66%, transparent 69%)`, each in its own tilted plane and depth:

  | Ring | Inset | Colours | Rotation | Plane | Blur / opacity | Depth |
  |---|---|---|---|---|---|---|
  | R1 | 4px | teal → periwinkle → lilac → pink | 11s | −12° / scaleY .92 | 3px / .95 | z +14 |
  | R2 | 0 | | 16s reverse | 24° / scaleX .9 | 5px / .8 | z −18 |
  | R3 | 10px | lilac / peach / teal | 8s | 70° / scaleY .82 | 2px / .7 | z +6 |

- **Eyes:** two 12×26px white pills, 22px apart, blinking every 6s. The whole orb floats ±6px over 8s.
- **3D turning:** a sphere never foreshortens, so **keep the core round** and move what's on it:
  - The eyes translate `sin(yaw)·48px` and squash `scaleX(.55 + .45·cos(yaw))`.
  - The shade moves the opposite way (`−sin(yaw)·34px`).
  - The rim light appears on the trailing edge, with alpha up to .5.
  - The rings rotate in real 3D: `perspective(520px) rotateY(yaw·.9) rotateX(pitch·.8)`.
  - Values ease towards their targets every frame, with factor .045 for yaw and .06 (or .2 when speaking or breathing) for the rest.
- **States.** Ring speed is a multiplier on the CSS animation's `playbackRate`; "glow" is the opacity of the outer halo.

  | State | Ring speed | Glow | Scale | Turn | Eyes |
  |---|---|---|---|---|---|
  | `idle` | 1× | 1 | 1 | every 4–8s it looks 18–32° to one side for 1.8s, then turns back; pitch ±2° | open |
  | `listening` | 1.25× | 1.3 | 1.03 | **never turns**; leans in (pitch −5°) | open |
  | `thinking` | 0.6× | 1 | .98 | drifts ±14° (sin t·.45); looks up (pitch 7°, eyes −5px) | .8 |
  | `speaking` | 1.8× | 1.45 plus voice pulse | up to +4% on each stress | sways ±10° | squint −25% on stress |
  | `breathing` | 0.7× | follows the breath | .86 → 1.08 (4s in, 6s out) | none | open on the breath in, close on the breath out |
  | `concerned` | 0.45× | 1.2 | .97 | none; pitch −4°, eyes +3px | .82 |

- **Performance:** pause the rAF loop and CSS animations when the orb is offscreen (IntersectionObserver). Under reduced motion it is fully static.
- **Production:** a direct React port of this file, using refs and `requestAnimationFrame` (no WebGL needed), is the expected approach. It replaces `src/components/presence/Presence.tsx` / `shader.ts`. Drive `state` from the existing presence state machine (`PRESENCE_STATES`), adding `concerned`.
- **Sizes:**
  - Home: 170px (phone) / 220px (desktop).
  - Voice Talk: 180 / 230.
  - Write Talk: 130 / 170.
  - Acute safety: 104 / 130.
  - Breathe: 220 / 260.
  - Landing: 200 / 260.
  - Landing step card: 118px.

---

## Screens
Copy below is exact. Where several states share a layout, only the differences are listed. Visuals for every one are in `Haven Site v2.dc.html`.

### Home & onboarding
1. **`home-first`**
   - Orb (idle).
   - H1 *"Somewhere quiet to think out loud"*.
   - Body *"Untangle a thought, get through a hard moment, or check in with yourself. Talk it out or write it down."*
   - Three promise chips (36px glass pills, aqua icons): *Remembers you, and shows you what · A sky for every talk · Private, never sold*.
   - Disclaimer at 13px faint, 72px above the dock: *"Haven is an AI companion for everyday reflection. It isn't a clinician or an emergency service. If you're in danger, call your local emergency number."*
   - Dock: Write · Tap to talk · Slow down.
2. **`consent`** (sheet over Home, no close button)
   - Title *"Before we begin"*.
   - Four rules, each with a 36px round icon:
     - *I'm an AI companion, not a clinician.*
     - *I'm not for emergencies.* The icon and 988 are lilac.
     - *I'll remember what matters.* This row has a **memory switch** (default on).
     - *Your words stay private.* This row ends with the link *"How I handle your data"*.
   - Checkbox row *"I'm 18 or older"*.
   - Primary button *"Let's begin"*, **disabled until the box is checked**.
   - Tertiary *"Not now"* goes back to Home without starting.
   - It is shown once, on the first Talk or Write.
3. **`home-return`**
   - Small line (15px muted): *"Good evening, Sam · Today feels like drizzle"*. The greeting follows the time of day, and the sky is the last one.
   - H1 *"How are you, really?"*
   - **Last time** row (glass, 72px): a 44px sky thumbnail, *"Last time · Wednesday"* over the title, and *"Pick up"* in `--lg-accent-strong`. It reopens that conversation with its context.
   - Nothing else competes with Talk.
4. **`menu`**
   - Rows (56px, aqua icons): *Talk · Your skies (30 days) · Your patterns · What I remember (5 notes)*, a divider, then *Settings · Sign in (Keep your cards) · Privacy*.
   - A lilac row at the end: *"Get help · crisis lines"*.

### Talking & writing
Layout from top to bottom: top bar, the orb (flexes to fill), captions (max-width 720px; left-aligned on phone, centred on desktop), status or alert rows, then the bottom controls (max-width 640px, 28px from the bottom).

5. **`talk-start`**: Haven speaks first: *"Hi Sam. I'm here, and there's no rush. What's on your mind?"*. Below it are the **starters**, 44px outline pills: *Something happened today · I've been feeling off · I can't stop thinking about something · I just need to vent*. Starters disappear after the first message.
6. **`talk-off`** (voice, mic idle): *"I'll say hello first. Tap the mic whenever you're ready."* Mute is disabled.
7. **`talk-listening`**: the orb is listening. Your words appear as a live muted caption. The mic shows level bars.
8. **`talk-speaking`**: the orb is speaking. The caption streams word by word with an 8px aqua dot pulsing at the end (`hvDot` 1.6s). Tapping the mic interrupts.
9. **`talk-text`** (Write): the composer plus *Style · Breathe · Transcript · End*.
10. **`talk-style`** (sheet)
    - Title *"What would help right now?"*, subtitle *"I'll lean this way until you change it."*
    - Radio rows (64px): *Whatever feels right (I'll follow your lead)* (the default) · *Just listen (Room to get it all out)* · *Help me make sense of it (We'll untangle what's going on)* · *Help me find a next step (Something small you can do)*.
    - Note: *"This lasts for this conversation. You can also just say it, like "can you just listen for a bit?""*
    - Picking an option closes the sheet.
11. **`talk-styled`**: after a choice, a quiet line appears under the reply: *"Okay. I'll just listen."* The Style tool gets its dot.
12. **`talk-slow`**: the orb is thinking. **After 8s** with no reply, a breathing dot shows with *"Taking a little longer than usual…"* and the secondary button *"Stop waiting"*.
13. **`talk-error`**: an inline alert (not a toast): *"That didn't send. Your words are still here."* with *Try again* as the primary. The unsent text stays in the composer and the Send button is shown.
14. **`transcript`** (sheet)
    - Subtitle *"Today · 6 minutes · only you can see this"*.
    - Each turn shows *Haven / You · time*. Haven turns have an aqua rule and text in `--lg-text`; your turns have a faint rule and muted text.
    - Sticky footer: *Copy text* (secondary) and *Back to talking* (primary).
15. **`end-confirm`** (alertdialog)
    - Title *"End and make your card?"*, subtitle *"I'll turn this into a reflection card. You can edit or delete it after."*
    - Buttons: *End and make my card* (primary) · *Keep talking* (secondary) · *End without a card* (tertiary).

### Safety & breathing
- **Safety is never optional and never removes the composer or the conversation.**
- The *Get help* button is in the top bar on **every** screen.

16. **`safety-elevated`**: the orb is concerned. A lilac pill *"Support options"* sits under the reply and opens Get help. It is offered, never forced.
17. **`safety-acute`**: this is triggered by the existing safety classifier at its acute level.
    - The orb shrinks.
    - A care panel opens **automatically**: a lilac gradient and border, the title *"You don't have to carry this alone"*, and the body *"You can talk to a person right now, free and any time. I'll stay right here."*
    - Buttons: *Call 988* (care fill) and *Text 988* (care outline).
    - Tertiary underlined *"I'm safe right now"* dismisses the panel. Log the dismissal.
    - The composer stays usable.
18. **`help`** (sheet; opens from anywhere)
    - Title (lilac) *"Talk to a person now"*, subtitle *"You deserve support. These are free and confidential."*
    - First, a care button: *"In immediate danger? Call 911"* (`tel:911`).
    - Then three line cards, each with Call / Text / Chat buttons:
      - *988 Suicide & Crisis Lifeline*
      - *Crisis Text Line (Text HOME to 741741)*
      - *The Trevor Project*
    - Then the region row *"Showing lines for United States · Change"*.
    - Footer note *"Free, confidential, any time. Closing this keeps our conversation right where it was."*
    - ⚠️ **The crisis line numbers and copy are placeholders that must be verified by the client or a clinician before launch.** Region detection should use the locale, with the picker as an override.
19. **`breathe`**
    - The orb is breathing; it paces the breath.
    - Phase in 30–42px/600 (*Breathe in / Hold / Breathe out*) with *"3 of 4 · round 2"* underneath (tabular numbers), `aria-live="polite"`.
    - Segmented radio: *Calm (In 4 · out 6)* (the default) · *Box (4 · 4 · 4 · 4)* · *Deep (4 · 7 · 8)*. The selected one is aqua.
    - Row *"Gentle vibration on each step"* with a switch. It uses `navigator.vibrate` and is hidden when that isn't supported.
    - *I'm done* (secondary) goes back to the screen you came from.
    - It is entered from Home "Slow down", the Talk tools, and the landing page.

### Reflection
20. **`reflection`**
    - **Card:**
      - A 132px sky header with the date bottom-left and the sky name bottom-right.
      - Title.
      - Quotes, 18px, with a left rule `2px rgba(143,240,232,.4)`.
      - Insight, 16px muted.
      - *"A small next step"* box (glass-strong).
      - Tag chips.
    - *"Does this feel right?"* with *Feels right* / *Not quite* (`aria-pressed`; the selected one is aqua with a check). *Not quite* reopens the conversation with that feedback.
    - Actions: *Save image* (primary; exports the share card) · *Read the conversation* (secondary) · *Delete* (tertiary, opens a dialog).
    - **Guest only:** a dashed box *"Want to keep this?"* with *"Right now your cards live only on this device. Sign in to keep them safe and see them anywhere."*, *Sign in* and *Not now*.
    - **Side column** (beside the card on desktop when wider than 2×440px, below it on phone):
      - *Your say*, a grouped card with *Edit this card* and *Sky* (current sky plus chevron). The note under it reads *"Your sky is how our conversation sounded to me, not a measure of you. You can change it."*
      - *What I'll remember from this*, a list of notes, each with *Forget*. Forgetting swaps the row in place for a dashed *"Forgotten."* row with an **Undo** button. Undo is available for 6s, then the note is committed.
      - The link *"See everything I remember"*.
21. **`reflection-edit`**
    - The card border goes aqua and an *"Editing"* badge appears.
    - Each part becomes a field: Title (22/600, character count *"49 left"*, max 80); quotes and the next step each have a remove (×) button; the insight is editable.
    - *Save changes* (primary) / *Cancel*. Note: *"Empty fields keep their old words. The saved image uses your changes."*
22. **`sky-picker`** (sheet)
    - Subtitle *"How did this conversation feel to you?"*
    - A 3×2 grid of skies (64px swatches): Clear, Haze, Drizzle, Storm, Rain then clearing, Quiet. The selected one has an `#8ff0e8` border.
    - The reason for the pick: *"I picked Rain, then clearing because it started heavy and ended lighter. Choose whatever feels truer."*
    - *Use this sky* / *Cancel*. A changed sky is labelled *"chosen by you"* in lists.
23. **`delete-confirm`** (alertdialog)
    - *"Delete this reflection?"*, subtitle *"The card, its sky and the conversation will be gone. This can't be undone."*
    - Checkbox *"Also forget the 3 notes from this conversation"*, unchecked by default, with the hint *"Otherwise I'll still remember them."*
    - *Delete reflection* (destructive) / *Keep it* (secondary).

### Skies, patterns & memory
24. **`skies`**
    - Desktop H1 *"Your skies"*, sub *"How the last 30 days of conversations sounded."*
    - Glass panel with:
      - The 76px **30-day sky line**, `role="img"` with a written summary as its `aria-label`.
      - Date ticks: *Sep 29 · Oct 14 · Today*.
      - A legend with a count per sky.
      - The note *"Each sky is how a conversation sounded to me, not a measure of you…"*
    - *Recent conversations* list, 64px rows: date (64px column), a 28px glowing sky dot, title, and *"time · sky"* with *"· chosen by you"* where the sky was changed. Each row opens its reflection.
25. **`skies-empty`**: an empty striped line, *"Your first sky is waiting"*, *"After each conversation, a sky appears here, so you can look back and notice how things have felt."*, and *Start a conversation*.
26. **`patterns`**
    - Sub *"Things that keep coming up. Brighter means more often."*
    - The constellation: stars sized 5–11px with an aqua glow `rgba(111,240,230,.55)` and linked by .3px lines. Each star is a **44px button** labelled with the topic and conversation count.
    - Note *"Topics that came up when we talked. Only you can say what they mean."*
27. **`patterns-topic`**: the selected star gets an aqua outline ring. A sheet shows the topic name, *"Came up in 3 conversations this month"*, conversation rows with sky dots, and *Talk about this* (primary, starts Talk seeded with the topic) / *Hide this topic*.
28. **`memory`**
    - Switch row *"Remember our conversations"* (*"I keep short notes so you don't have to start over."*).
    - *In short* summary box.
    - Groups *People · What's going on · What helps*. Each note has *Edit* (inline) and *Forget* (with Undo, as above).
    - *Add something* (secondary) and an underlined *Forget everything*, which opens a destructive dialog.
29. **`memory-off`**: the switch is off, its note reads *"Off. Turn it on whenever you like."*, a dashed notice reads *"Remembering is off. I'm not adding notes or using the ones below. They stay until you delete them."*, and the notes are dimmed to 60%.

### Account & settings
30. **`settings`** (grouped list rows)
    - **Account:** *"You're using Haven without an account"* / *"Everything stays on this device."* with a *Sign in* button.
    - **Conversations:**
      - *Remember our conversations* (link to Memory, value "On").
      - *Ambient sound* (switch).
      - *Match my sky* (switch, **disabled until Ambient sound is on**).
      - *Voice* ("Calm · normal speed").
    - **Your data:** *Export everything* · *Delete everything* (*"…This can't be undone."*, opens a destructive dialog that requires confirmation) · *How I handle your data*.
    - **About:** *Terms* · *Help and crisis lines*.
    - Footer *"Haven 1.4 · Made for everyday reflection, not emergencies."*
31. **`signin`**
    - *"Keep your conversations safe"*, with *"…You don't need one to talk."*
    - *Continue with Google* (white button `#effcfa` with `#0b2a35` text and the Google G).
    - An "or" divider, an Email field (52px), and the primary *"Email me a sign-in link"*.
    - Footnote *"No password. We'll only use your email to sign you in."*
    - Validate the email on submit, with the inline error under the field.
    - Signing in merges the guest's local data into the account.
32. **`signin-sent`**: *"Check your email"*, *"I sent a sign-in link to sam@example.com. It works for 15 minutes."*, *Send it again* (rate-limited to once every 30s) / *Use a different email*.
33. **`privacy`**
    - Lead *"What you share here is personal. Here is exactly what happens to it."*
    - Groups:
      - *Where your words go*: without an account / with an account / to reply.
      - *What we never do*.
      - *Your controls*.
    - *Export everything* and *Delete everything* (destructive outline), plus a contact email.
    - **Legal must confirm every claim** before launch, especially "Our team cannot read your conversations" and "Neither may keep or train on them".

### Landing page (`Haven Landing v2.dc.html`): 3 sections only
The page sits on `#081822` with a `clamp(0,1.2cqi,16px)` inset; the panels have `clamp(0,2.4cqi,32px)` radius.
1. **Hero** (`--lg-bg` panel with a bottom aqua glow)
   - Glass pill nav, max-width 720px: logo · *Sign in* (desktop only) · *Get help*.
   - H1 *"Somewhere quiet to think out loud"*.
   - Sub *"A calm AI companion for untangling a thought, getting through a hard moment, or checking in with yourself."*
   - Orb, idle.
   - **Talk** (primary aqua with glow) and **Write** (glass), side by side, max-width 420px.
   - Line *"Free to try · No account needed · Private by default"*. ⚠️ "Free to try" depends on the pricing decision.
2. **How it works**
   - H2 *"Talk. Untangle it. Keep what matters."*
   - Three cards (auto-fit, min 280px), each with a 150px preview:
     - *Say it however it comes out* (a live listening orb).
     - *Get the help you need right now* (a caption preview with style chips).
     - *Leave with a card and a sky* (a mini card).
3. **Honest about what it is** (`--lg-bg` panel, top glow)
   - Three facts: *Private by default* · *An AI, not a therapist* · *Not for emergencies* (care surface, 988 / 911, a *Get help* link).
   - Talk and Write again.
   - A footer built into the panel: logo · Privacy · Terms · Sign in.

SEO: `<title>Haven · a calm AI companion to talk things through</title>`, plus the meta description and OG tags shown in the file. The OG image (1200×630) is still to be produced.

---

## Interactions & behaviour
- **Navigation:**
  - Phone: Back (top-left) plus the Menu sheet.
  - Desktop: the pill nav plus Menu as a side panel.
  - Talk is full-focus: no nav, just the status pill and Back.
- **Voice/Write switching** is always one tap: the composer mic ↔ the voice tools "Write". The conversation is preserved.
- **Starters** dismiss on the first message and never come back in that conversation.
- **Style** persists for the conversation only. Reset it on End.
- **Thinking timer:** show "Taking a little longer…" at 8s. *Stop waiting* cancels the request and keeps the user's message editable.
- **Errors** are always inline, next to the thing that failed, with a retry. Never lose user text.
- **Undo** for Forget: 6s, then commit. Bulk deletes use a confirm dialog instead of undo.
- **Acute safety** overrides everything: it opens the care panel, sets the orb to concerned, and stays open until the user responds. Never block typing.
- **Focus:** every interactive element shows the `#e6f59a` ring. Sheets trap focus, close on Esc, and return focus to the trigger.
- **Live regions:** captions `aria-live="polite"`; slow reply and Breathe phase `role="status"`; errors `role="alert"`.
- **Responsive:** the designs use container units (`cqi`). The phone layout applies under ~720px; the reflection goes to 2 columns at ≥ 2×440px. Sheets switch from bottom sheet to centred dialog at the desktop breakpoint.
- **Reduced motion:** the orb is static, with no pulses, bars or sheet slides (use instant fades).

## State management
- `session`: `mode: 'voice' | 'write'`, `micState: 'idle' | 'listening' | 'speaking'`, `muted`, `style: 'auto' | 'listen' | 'sense' | 'step'`, `turns[]`, `pending`, `pendingSince`, `error`, `safetyLevel: 'none' | 'elevated' | 'acute'`, `starterDismissed`.
- `orbState` derived from: safety (concerned) > mic speaking > mic listening > pending (thinking) > idle. Breathe sets breathing.
- `reflection`: card fields, `sky`, `skyChosenByUser`, `feedback: null | 'right' | 'notQuite'`, `editing`, `notes[]` with a pending-forget timer.
- `memory`: `enabled`, `summary`, `notes[]` by category.
- `settings`: `ambientSound`, `matchSky` (requires `ambientSound`), `voice`, `haptics`, `breathPattern`.
- `user`: guest vs signed-in. Guest data lives in local storage and is merged on sign-in.
- `consent`: `accepted`, `isAdult`, `rememberDefault`, stored once.

## Assets
- **Icons:** inline 24px-viewBox stroke icons, 1.6–1.9 stroke, round caps (mic, pencil, breathe rings, heart, phone, chevrons, close, transcript lines, sliders). Use the codebase's icon set if it has matching glyphs, otherwise lift the SVG paths from `Haven App v2.dc.html`.
- **Google "G":** official brand mark (inline SVG in the sign-in screen).
- **Font:** Geist from Google Fonts, or self-host it.
- There are no raster images. Skies and the orb are pure CSS and JS.

## Repo mapping (from `github.md`)
| Design | Repo |
|---|---|
| All app screens | `src/app/*/page.tsx`, `src/components/talk/`, `src/components/safety/`, `src/components/reflection/ReflectionCard.tsx` |
| Orb | `src/components/presence/Presence.tsx`, `shader.ts`: replace with the `haven-orb.js` port |
| Skies | `src/components/sky/` |
| UI primitives (button, switch, row, sheet, top bar, dock) | `src/components/ui/`, `src/components/captions/` |
| Tokens | `src/styles/tokens.css` ← `lagoon.css` |

## Open items before launch
1. Verify every crisis line, number and the region list (Get help, consent, landing).
2. Legal review of the privacy copy.
3. Pricing: "Free to try" on the landing page.
4. Share-card export (1080×1350 feed / 1080×1920 stories) restyled in Deep lagoon. It isn't designed in this round; use the reflection card layout on `--lg-bg`.
5. OG image (1200×630).
