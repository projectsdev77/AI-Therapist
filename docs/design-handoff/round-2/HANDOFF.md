# Haven, design round 2: new controls from the product review

The app is built and already uses your direction 3a, "Sage & lamplight". A product review asked for more user control and an easier start. I've built all the logic behind those changes. Nothing new is visible yet, because these pieces need design. Please design the seven items below in the existing visual language. Don't restyle anything else.

**Attached:** this file; `src/styles/tokens.css` (current tokens); your previous `from-designer/HANDOFF.md` (direction 3a, for reference); and `round-2/screens/`, the current app at 390 px in both themes (plus two at 1280 px), showing where each item goes.

## 1. Ground rules (unchanged from round 1)

- No chat bubbles. Captions under the orb stay the main view.
- "Get help" stays visible on every screen. Safety UI stays warm (the care color), never alarm red, and never blocks the conversation.
- WCAG 2.2 AA contrast in both themes, including over every sky. 44 px minimum touch targets. A reduced-motion version of anything that moves.
- Talk and Write stay equal choices.
- Public copy never says "therapy", "therapist" or "treatment".
- Phone first. People often use this at night, while upset. **Every new control is optional.** Nobody should have to choose, rate or edit anything to keep going.
- Use existing tokens and components where they fit: buttons (primary, secondary, ghost, care, link), the switch, the bottom sheet, the pills used for themes and the crisis panel. If you need new tokens, name them and say what they're for.

## 2. What to design

### D1. Starting points (conversation screen, before the first message)

**Why:** some people open the app and don't know what to say.

**What's built:** five starters. Tapping one sends its words as the person's first message, and the companion replies as usual. Two of them also set the support style (D2).

| Starter (proposed wording, you may edit) | Also sets |
| --- | --- |
| Something happened today | – |
| I've been feeling off lately | – |
| I can't stop thinking about something | – |
| I don't know what I'm feeling | Help me understand |
| I just want someone to listen | Just listen |

**Behavior:**
- Shown after the companion's greeting, in both Write and Talk modes. In Talk mode, people can tap a starter instead of speaking.
- Hidden for good once the person has said or typed anything.
- Ignoring them changes nothing.

**Screens:** `03-talk-write-start-*` (Write mode, greeting shown) and `05-talk-voice-*` (Talk mode, listening).

**Constraint:** the greeting caption and the orb must stay visible at 390 × 844.

### D2. Support style (conversation screen, any time)

**Why:** sometimes people want to be heard, sometimes to understand, sometimes to decide what to do. When the companion gets it wrong, they need an easy way to redirect it.

**What's built:** three styles, plus "none" (the default, where the companion follows the conversation). The choice applies from the companion's next reply and lasts for this conversation. People can change it or clear it at any time.

| Style | Proposed label |
| --- | --- |
| listen | Just listen |
| understand | Help me understand |
| act | What can I do? |

**Behavior:**
- Choosing a style sends no message on its own. Please decide whether to show a quiet acknowledgement (for example, "Okay. I'll just listen.") or let the next reply show it.
- The current choice should be visible but quiet.
- People can also just say "I just want to vent"; the companion follows that too. The control is a shortcut, not the only way.
- It must not feel like a form. Please don't make it a required first step.

**Screens:** `04-talk-write-mid-*` and `05-talk-voice-*`.

**Constraint:** the bottom band already holds the text box (or voice status), Breathe, Transcript and End. On 390 px there's little room.

### D3. Slow reply (conversation screen)

**Why:** if a reply is slow, people shouldn't be left wondering.

**What's built:** after 8 seconds with no reply text, the conversation is marked as slow, and the slow state clears as soon as text arrives. "Cancel" gives up on that reply: the person's message stays, and they can say more. In Talk mode, switching to writing already exists.

**Design:**
- A message (proposed: "Taking a little longer than usual…").
- Actions: **Cancel**, and in Talk mode also **Switch to writing**.
- Today, three pulsing dots in the caption area show that the companion is thinking. Design how the slow state takes over from them.

### D4. Your say over the reflection card (reflection page)

**Why:** a card is an interpretation. People need to be able to say it's wrong, fix it, and choose what is remembered.

**What's built:**

1. **Feedback:** "Feels right" or "Not quite", one tap, changeable, and it can be cleared. "Not quite" also tells the companion not to rely on that card in later conversations.
2. **Edit the card:**
   - Title (up to 80 characters).
   - The 1–3 quotes (200 each; one can be removed).
   - The insight (400).
   - The next step (160, or removed).
   - A blank title or insight keeps the old text. The date of the last edit is stored, so you could show "Edited", optionally.
   - The saved image uses the edited text.
3. **What I'll remember from this:**
   - The notes the companion took from this conversation, each removable.
   - Removing one deletes that note; the What I remember page offers Undo for 8 seconds after forgetting a note, and the same could apply here.
   - Hidden when memory is off or nothing was noted.
   - Notes are saved when the card is made, so removing one is "forget", not "don't save".
4. **Choose the sky:**
   - The person can pick a different sky for this conversation: Clear, Haze, Drizzle, Storm, or "Rain, then clearing".
   - Your skies and Home follow the choice, and the app records that the person chose it.

**Screens:** `06-reflection-*` (mobile, and desktop dark). Today the page has the card, then Save image, Read the conversation and Delete.

**Design:**
- Placement of all four.
- Edit mode for the card.
- The sky picker.
- The remember list in three states: with notes, empty, and memory off.
- The feedback states.

**Constraint:** the card should still read as a finished object, not a form. The person should be able to ignore all of this.

### D5. What the skies and patterns mean (copy placement)

**Why:** the sky could feel like the app judging someone's mood, and patterns could feel like a diagnosis.

**Proposed lines** (you may rewrite them):
- **Skies:** "Your sky is how our conversation sounded to me, not a measure of you. You can change it."
  - Where: the reflection page near the sky picker, Your skies (`07-your-skies-*`), and possibly Home's "Today feels like…" line.
- **Patterns:** "Topics that came up when we talked. Only you can say what they mean."
  - Where: Your patterns (`08-patterns-*`).

**Design:** the placement and the type style.

### D6. "Help me slow down" on Home

**Why:** someone overwhelmed may not be ready to talk.

**What's built:** the Breathe page at `/breathe`.

**Design:**
- A small secondary action on Home that opens Breathe, on both the first-visit and returning layouts (`01-home-first-visit-*`, `02-home-returning-*`).
- It must stay visibly secondary to Talk and Write.

### D7. Check the new wording

I changed text inside existing elements. Please check that it reads well and fits:
- **Home (first visit) subtitle:** "Untangle a thought, get through a hard moment, or check in with yourself. Talk it out or write it down."
- **Consent sheet, "Your words stay private" line:** now adds "To reply, your words go to our AI provider; spoken words go to a speech service." The consent sheet already has the memory switch, so no change is needed there.

## 3. What I need back

1. **Mockups** at 390 px and 1280 px, in both themes, for:
   - D1 in Write and Talk modes.
   - D2: closed, open, and each option chosen.
   - D3 in Write and Talk modes.
   - D4: default, edit mode, sky picker open, the remember list in its three states, and the feedback states.
   - D5 on each screen where it appears.
   - D6 on both Home layouts.
2. **Component states:** default, hover, focus, pressed, disabled and selected for every new control.
3. **Final copy** for every new string.
4. **Tokens:** any new tokens, with the same naming scheme as `tokens.css`.
5. **Motion:** how starters leave, how the slow state appears, edit-mode transitions, and the sky picker. Include the reduced-motion versions.
6. **Behavior changes:** anything in your design that changes behavior beyond what is described here, listed separately.

HTML/CSS mockups that I can open are best, as in round 1.
