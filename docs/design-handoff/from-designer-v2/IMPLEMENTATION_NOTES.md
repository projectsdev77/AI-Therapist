# Deep lagoon v2: implementation notes

The designer's handoff in this folder (`README.md`, `Haven App v2.dc.html`, `Haven Landing v2.dc.html`, `haven-orb.js`, `lagoon.css`) is implemented. Below: what was built as specified, where the build differs, and which design changes were never discussed or agreed.

## Built as specified
- **Tokens:** `lagoon.css` → `src/styles/tokens.css`. Dark only, Geist only, the background gradient and three streaks, the lime focus ring, motion tokens, reduced motion.
- **Orb:** `haven-orb.js` ported to React in `src/components/presence/Presence.tsx` (DOM layers, three rings, eyes, 3D turn, all six states, offscreen pause, static under reduced motion). It replaces the WebGL shader.
- **Shared components:**
  - Top bar (logo or Back, desktop pill nav, talk status pill, phone page title, Get help, Menu)
  - Dock with the raised mic, tools row, composer
  - One sheet/dialog shell (bottom sheet on phone, centred dialog on desktop, side panel for the menu)
  - Buttons, switch, list rows
- **Screens:** all 33 app screens and states, plus the 3-section landing page. Returning visitors go from `/` to `/home` on the server (a cookie set at consent; `src/proxy.ts`).
- **Behaviour:**
  - Starters dismiss on the first message.
  - Style lasts for the conversation, with a quiet acknowledgement.
  - "Taking a little longer…" appears at 8s, with Stop waiting.
  - Errors are inline with Try again.
  - Forget has a 6s Undo.
  - The sky picker includes the new Quiet sky (migration `0003_quiet_sky.sql`).
  - "chosen by you" shows on skies the person picked.
  - The acute care panel opens on its own, and "I'm safe right now" logs a safety event.
  - Breathe shows the phase, "N of M · round R", three patterns and the vibration switch.

## Where the build differs from the design, and why
| Design | Built | Why |
| --- | --- | --- |
| "End" (tools row, voice dock, dialog) | **"Wrap up"**, with a check icon | Agreed with the client before this handoff. |
| End dialog: End and make my card / Keep talking / **End without a card** | Wrap up and make my card / **I'll be back** / Keep talking | "I'll be back" was agreed (Home's "Pick up" resumes it). "End without a card" was never discussed, so it isn't built. |
| Back button on Talk goes straight Home | Opens the Wrap up dialog once you've said something | Agreed: leaving through the app's own controls asks first. |
| Crisis numbers written as 988 / 911 (consent, care panel, landing, Get help) | Region-aware, from `src/lib/safety/resources.ts` | The design hard-codes US numbers. |
| Get help lists The Trevor Project and "Chat online" | Not added | New crisis lines need verifying by the client or a clinician first. |
| Landing hero line "Free to try · No account needed · Private by default" | "Free to try" left out | Pricing isn't decided. |
| Sign-in "It works for 15 minutes" | "It works once" | Supabase's link lifetime is configurable; don't promise a number. |
| Privacy: "Our team cannot read your conversations", "Neither may keep or train on them", contact privacy@haven.app | Accurate wording kept; no contact address | These need legal and provider confirmation, and the domain isn't decided. |
| Settings: Account, Conversations, Your data, About | Same, plus **Name** and **Region** under Account, and **Sound** (rain, room tone, hum) when ambient is on | The design dropped these. The companion uses the name; region picks crisis lines; the sound picker already existed. |
| Settings footer "Haven 1.4" | No version number | The app has no public version yet. |
| Delete reflection: "Also forget the notes" **unchecked** by default | **Checked** by default | Until now, deleting a conversation deleted its notes, and the privacy copy says so. The option to keep them is built; flipping the default is the client's call. |
| "Not quite" reopens the conversation with that feedback | Records the feedback; the companion is told not to lean on that card | What "reopens" should do isn't specified. |
| Orb speaking pulse is simulated | Ported exactly (not driven by the real voice) | The design says "port exactly". The previous orb followed the actual voice and mic level; this can be wired back in. |
| A small "Demo mode · replies are scripted" label on Talk | Kept | It only shows when no Claude key is set. |

## New in the design, not discussed before (built; easy to remove)
- **One dark theme only.** Dawn (light) and the theme setting are gone.
- **Home dock.** Talk is now the big centre button, with Write and Slow down as smaller side buttons. Round 1's rule was "Talk and Write are equal choices". The landing page keeps them side by side.
- **Live sky behind the conversation is gone.** The background is the same lagoon gradient everywhere; skies are now colours on cards, lists and the sky line. The weather idea stays, though the client had asked to replace it.
- **Starters:** four instead of five. "I don't know what I'm feeling" was dropped, and "I just want someone to listen" became "I just need to vent" (it still sets Just listen).
- **Patterns:** "Talk about this" (starts a conversation about that topic) and "Hide this topic" (per device, with "Show N hidden topics" to undo).
- **What I remember:** "Forget everything" (notes and summary; conversations and cards stay), behind a confirmation.
- **Transcript:** Copy text.
- **Desktop:** a pill nav (Talk, Your skies, Patterns, What I remember); the menu opens as a side panel.

## Fixed after the handoff (product calls)
- **Contrast at the top of the screen.** The gradient's top stops were darkened (#15726c → #0d4643, #10565c → #0b3a40). Muted, faint, accent-strong and care text were lightened (#d3eae9, #c2dedd, #a8f5ee, #e6dcff). Every text colour now passes 4.5:1 at the lightest point of the gradient, including on glass, except faint text on strong glass (about 4.2:1).
- **The orb follows the real voice.** In voice mode, the speaking pulse follows the companion's actual audio level and listening swells with the mic. Write mode keeps the design's simulated pulse.
- **App icons, favicon and link preview** were redrawn in the lagoon style from the orb (`src/app/icon.svg`, `public/icons/*`, `src/app/opengraph-image.png`).
- **Breathe** no longer tries to vibrate before the first tap.
- **Decided, to revisit after testing:**
  - Keep "Talk about this", "Hide this topic" and "Forget everything".
  - Deleting a card forgets its notes by default.
  - Keep the skies for now.

## Still open
- **The share-card image** wasn't designed this round. It's drawn in the lagoon style from the reflection card (`src/lib/reflection/cardImage.ts`).
- **Home dock:** Talk is bigger than Write. Revisit if testers who prefer writing miss it.
