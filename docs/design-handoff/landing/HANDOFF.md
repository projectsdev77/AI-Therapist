# Haven: landing page brief

The app is built in your direction 3a, "Sage & lamplight". It has no real landing page yet. A first-time visitor lands on the app's Home (`screens/01-home-first-visit-*`): a greeting, Talk and Write, three short points, and a one-line disclaimer.

That's a fast front door, but it doesn't explain the product to someone who arrives from a friend's post or a search and doesn't yet know what Haven is or whether to trust it. Please design a landing page for them, in the same visual language. Don't restyle the app.

**Attached:** this file; `tokens.css` (the current tokens); your round-1 `HANDOFF.md` (direction 3a); and `screens/`, the current first-visit Home, the consent sheet and the privacy page, at 390 px and 1280 px, in both themes.

## 1. Who it's for, and the one job it has

**Who:** an adult who may be stressed or upset right now, often at night, often on a phone. They don't know what Haven is, whether it works, or whether it's safe to use.

**Its job:** in a few seconds they should understand:
- what they can do here;
- how it helps;
- what happens when they press start;
- that no sign-up is needed;
- that it is an AI, not therapy.

Then they should start, or know why not. The page earns trust; it doesn't sell. Starting must stay fast: the goal is a first conversation within 10 seconds of landing.

## 2. How it fits the app (already decided; for your awareness)

- **New visitors** see the landing page at the main address.
- **Returning visitors** (anyone who has accepted the consent sheet on this device) go straight to their usual app Home and never see the landing page. I'll handle this on the server, so there's no flash.
- **Starting.** The start actions open the existing consent sheet, then the conversation, exactly as Home does today. No sign-up.
- **Get help.** The existing Get help button, with the region's crisis lines, must be visible on this page too.
- **Links.** The landing page links to the existing `/privacy` and `/terms`, and to Sign in, which only appears once accounts are switched on.

## 3. Content it must carry

You decide the structure, order, layout and final wording. Below are the facts to work from. Use only these: no invented features, numbers or quotes.

1. **What it is.** A calm AI companion for untangling a thought, getting through a hard moment, or checking in with yourself. You can talk out loud or write.
2. **Starting.** Talk and Write are equal choices. "Help me slow down", which opens the breathing exercise, is a smaller secondary choice. No account needed.
3. **How a conversation works:**
   - A living orb listens and reacts; there are no chat bubbles.
   - Words appear as captions.
   - The sky behind it follows the mood of the conversation.
   - When you finish, the conversation becomes a reflection card (a title, your own words, one insight, an optional small next step) and a sky you can look back on.
   - Your patterns shows recurring themes as a constellation.
   - Breathe is a guided breathing exercise.
4. **Memory:**
   - It remembers what matters between conversations, the way a counselor keeps notes.
   - It's on by default, and you can turn it off before your first conversation.
   - You can see, edit or delete everything it remembers.
5. **What it is not:**
   - An AI companion, not a therapist, clinician or human.
   - It can't diagnose or give medical advice.
   - It's not for emergencies; Get help shows crisis lines for your region.
   - If something sounds serious during a conversation, it shows support options, stays with you and doesn't end the conversation.
6. **Privacy, in plain words:**
   - Without an account, everything stays on your device.
   - With an account, it's stored privately and only you can see it.
   - Your words go to an AI provider so it can reply, and spoken words go to a speech service.
   - Never sold, never used for ads, no conversation content in analytics.
   - Export or delete everything at any time.
7. **Frequently asked questions.** At minimum:
   - Is this therapy? (No.)
   - Do I need an account? (No.)
   - What does it remember, and can I turn that off?
   - What if I'm in crisis? (Get help, crisis lines, emergency number.)
   - Does it work on my phone? (Yes. Voice needs a microphone; writing works anywhere.)
   - What languages? (English for now.)
   - Is it free? **Leave a clearly marked placeholder.** Pricing is the client's decision and isn't made yet.
8. **Footer:** Privacy, Terms, Get help, and the disclaimer line.

## 4. Ground rules

- **No therapy words.** Public copy never says "therapy", "therapist" or "treatment", except to say it is *not* therapy.
- **No invented proof.** No testimonials, user counts, ratings, outcome claims or press logos; none exist. Don't promise results ("you'll feel better").
- **The name is a placeholder.** "Haven" may change; keep the name easy to swap.
- **Same safety rules as the app.**
  - Get help is always visible.
  - Safety UI uses the warm care color, never alarm red.
  - Crisis information is easy to find without scrolling far.
- **Accessibility.** WCAG 2.2 AA contrast in both themes, including over skies. 44 px touch targets. Fully keyboard usable. A reduced-motion version of anything that moves.
- **Reuse the app's pieces.** The live orb (WebGL) and the sky renderer can be placed on this page. Use them where they help, but the page must still load fast on a phone.
- **Theme.** It follows the device theme (Twilight dark, Dawn light), like the app.
- **Legal.** The copy will get a legal review before launch, so keep claims modest and literal.

## 5. What I need back

1. **Mockups** of the full page at 390 px and 1280 px, in both themes, as HTML/CSS I can open, driven by the token names.
2. **Final copy** for every string, including the page title and the description used in search results and link previews.
3. **A link-preview image** (1200×630) for sharing.
4. **Component states:** default, hover, focus and pressed for every link and button.
5. **Motion:** what moves (orb, sky, section reveals, if any), plus the reduced-motion versions.
6. **Tokens:** any new tokens, named in the same scheme as `tokens.css`, with what each is for.
7. **Behavior changes:** anything in your design that changes behavior beyond section 2, listed separately.

Ask me if anything is unclear before you go deep.
