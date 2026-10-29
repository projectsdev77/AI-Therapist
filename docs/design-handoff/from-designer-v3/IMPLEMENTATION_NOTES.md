# Desktop handoff (v3): implementation notes

The designer's desktop screens (`Haven Desktop.dc.html`, all 33 states at 1440 × 900, plus the 1024px compact layout) are built. Phone and tablet layouts are unchanged.

## How it's built
- **Breakpoints:**
  - **Under 720px:** the phone design.
  - **720–1023px:** the phone design widened, with the top bar's pill nav, as before.
  - **1024px and up:** the new desktop app shell.
  - **1024–1279px:** the compact shell.
- **Shell** (`src/components/shell/AppShell.tsx`):
  - **Sidebar:** logo, New conversation, navigation with a note count, Recent conversations with their skies, Get help, and the account button with its menu.
  - **Page** in the middle.
  - **Side panel** on the right. Get help replaces the panel instead of covering the page.
  - **Compact (1024–1279px):** icon sidebar; the panel opens over the page from a toggle (shortcut `]`).
- **Screens:**
  - **Home:** first visit and returning.
  - **Consent:** 2×2 grid.
  - **Conversation:** header, a readable writing view, the voice stage with its floating control bar, and a panel with the orb, reply style, Transcript tab, Breathe and Get help.
  - **Acute care panel** opens on its own.
  - **Breathe**.
  - **Reflection:** Your say in the panel, inline sky picker, and editing with the panel hidden.
  - **Your skies:** month calendar; the day's conversations show in the panel.
  - **Patterns:** ranked list, and a topic panel.
  - **What I remember:** switch, In short and Forget everything in the panel.
  - **Settings, Sign in, Privacy:** Your controls in the panel.
- **Tests:** Playwright now runs three projects: mobile, tablet (900px), and desktop (1440px, `tests/e2e/desktop.spec.ts`, including the compact layout). Each test gets its own client address so the server's rate limit doesn't trip under parallel runs.

## Changed after testing
- **The conversation screen keeps its simple layout at every size**, with no sidebar and no side panel, at the client's request. The design's desktop conversation screens (header, writing view with bubbles, panel with orb, style, transcript and care) are not used. The keyboard shortcuts still work there.

## Where the design went against what we'd agreed (our version kept)
| Design | Built | Why |
| --- | --- | --- |
| "End & make card"; dialog "End and make your card?" with **End without a card** | **Wrap up**; Wrap up and make my card / I'll be back / Keep talking | Agreed with the client; the designer wasn't updated. |
| 911 and 988 written in; The Trevor Project and "Chat online" | Region-aware lines from `src/lib/safety/resources.ts` | Crisis lines must match the person's region and be verified. |
| Sign-in "It works for 15 minutes"; "Anything on this device moves into your account" | "It works once"; the move line left out | Link lifetime is configurable; moving data is offered, not automatic. |
| Privacy: "Our team cannot read your conversations", "Neither may keep or train on them", "Updated Oct 1, 2026", privacy@haven.app | The accurate wording, including the note about Gemini's free tier | Not true yet, or not decided. |
| Settings without Name, Region and Sound; "Haven 1.4" | Name, Region and Sound kept; no version | The companion uses the name; region picks crisis lines. |
| Delete: "Also forget the notes" unchecked | Checked by default | Agreed default, matching the privacy page. |
| `lagoon.css` with the original top colours | The darker top and lighter text from our contrast fix | Readable text at the top of every screen. |
| "What to expect": "No chat bubbles, no rush." | "No rush." | The desktop writing view does show your messages in bubbles. |
| "Feel right? · Yes / Not quite" | "Does this feel right? · Feels right / Not quite" | Same words as on phone. |

## New in this design, not discussed before
**Built** (each is easy to remove):
- **The desktop shell itself:** a sidebar with recent conversations, an account menu, and the side panel.
- **Keyboard shortcuts:**
  - N new conversation
  - Space talk or pause
  - W write
  - M mute
  - B breathe
  - 1–4 reply style
  - Esc wrap up, or leave Breathe
  - E edit the card
  - ⌘/Ctrl Enter save the card
  - `]` show or hide the panel
  - `?` show the shortcuts
  - `,` open Settings

  The shortcuts are listed in a dialog (account menu or `?`) and under a Keyboard group in Settings.
- **Desktop writing view** shows the whole conversation, with your messages in bubbles and the newest reply largest. Phone keeps captions. This is closer to a chat than we aimed for ("stay away from just chatbot"); worth checking in testing.
- **Home text box:** you can type straight into Home, and your first words open the conversation (passed through session storage, never the URL). Home also has a "Last 14 days" strip and a few notes.
- **"Start in" setting** on desktop: what New conversation opens. Writing by default, per device.
- **Your skies on desktop** is a month calendar instead of the 30-day line.
- **Patterns on desktop** has a ranked topic list.
- **Breathe on desktop:** "Soft sound on each step", on by default, in place of vibration.

**Not built** (needs a decision):
- **"Noticing so far"** in the conversation panel: live notes such as "Comparing yourself to friends who found jobs", with "These become your card when you end".
  - It needs an extra AI step on every message. That costs money, and is tight on Gemini's free tier.
  - Cards aren't made from these notes, so the promise wouldn't be true as written.
- **"Edit"** on a message that didn't send. Try again is built.
- **"End without a card"** (as before).
