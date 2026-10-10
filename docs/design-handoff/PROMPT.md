# Prompt for Claude Design

Attach these files with the prompt:
- `docs/DESIGN_HANDOFF.md`
- `src/styles/tokens.css`
- the screenshots in `docs/design-handoff/screens/` (all of them, or at least the `-dark` and `-light` mobile set)

---

I'm redesigning the visual layer of an existing, working web app: a voice-first AI companion for everyday emotional support and self-reflection (placeholder name "Haven"). The attached DESIGN_HANDOFF.md is the brief. Read it fully before starting; its constraints are firm. The screenshots show every current screen and state, and tokens.css holds every current visual value.

The client's one request was: "Stay away from just chatbot — how can we visually stand out?" The current build answers that with a living orb, film-style captions instead of chat bubbles, a sky ("Inner Weather") for each conversation, reflection cards, and a constellation of recurring themes. Keep those ideas, and make them beautiful, distinctive, and calm. This should feel like a quiet room at dusk, not a tech product or a clinic.

What I want from you:
1. A visual direction. Propose 2–3 distinct directions first, each as one hero screen (the talk screen) in both themes, with a short rationale. Then take the strongest (or the one I pick) through the whole app.
2. The full redesign in exactly the formats listed in §9 "What I need back":
   - updated tokens with the same variable names, for both themes (Twilight dark and Dawn light)
   - every screen in §4 at 390px and 1280px, in both themes
   - every component state in §5
   - a motion spec, including new values for the orb's PRESENCE_STATES table
   - SVG assets: logo/wordmark, app icon with a maskable version, weather glyphs, icons
   - a separate list of anything that changes behavior, not just looks
3. Answers or proposals for the open questions in §8: name and wordmark, orb character, weather illustration style, ambient sound, and a 1080×1920 share card.

Hard rules (from §2; don't break these):
- No chat bubbles. The transcript stays a secondary view.
- The orb stays a generative, audio-reactive shader. Redesign its look and motion, but no video or Lottie.
- "Get help" is visible on every screen. Safety UI is warm and calm, never alarm red, and the crisis panel never blocks the conversation.
- WCAG 2.2 AA contrast everywhere, including captions over every sky in both themes. 44px touch targets. A reduced-motion version of everything.
- Talk and Write are equal choices on the home screen.
- Public copy never uses "therapy", "therapist", or "treatment".
- Phone-first. Many people will use this at night, often while upset.

Please deliver HTML/CSS mockups I can open, if possible, and keep everything driven by the token names so I can implement it directly. Ask me if anything in the handoff is unclear before you go deep.
