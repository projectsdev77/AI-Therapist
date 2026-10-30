# Haven: make it simpler (design brief, round 4)

**The ask:** Haven works, but every screen has too much on it. Redesign it so each screen does one thing, with fewer boxes, buttons and labels, while keeping every feature and safety rule listed below. Phone first; desktop should feel like the same calm app, not a dashboard.

`screens/phone` and `screens/desktop` show every screen as it is built today (desktop at 1440 × 900, phone at 390 × 844). The app runs in demo mode in these, so ignore the "Demo mode" label.

## 1. Who it's for and how it should feel
- Someone at the end of a hard day, often on a phone, often tired or upset. They should be able to start talking within one tap and never have to think about the interface.
- **Feel:** quiet, warm, unhurried; like a calm room, not an app. Generous empty space. One thing to look at at a time.
- The client's words: "stay away from just chatbot", "nothing to distract the user". The client liked the earlier, simpler conversation screen: no sidebar and no panel, just the orb, the words and the text box.

## 2. What's too busy today (please fix)
These are the problems, screen by screen. The solution is yours; nothing here prescribes a layout.

**Everywhere**
- Too many containers: glass cards inside glass cards, outlined pills, chips and dividers on nearly every screen. Most screens would read better with plain text on the background and one card at most.
- Too many small grey labels and helper lines (subtitles, "Applies from my next reply…", "Your sky is how our conversation sounded…"). Keep the ones that prevent a mistake; drop the rest.
- Two names for the same thing: **Slow down** (Home) and **Breathe** (everywhere else). Use one name.
- Group labels are sentence case on phone and UPPERCASE on desktop. Use one style.
- There are three layouts (phone; tablet; desktop with sidebar and side panel), and desktop feels like a different product. Desktop should be the phone experience given more room, not a three-column dashboard.

**Home** (`phone/02`, `phone/15`, `desktop/02`, `desktop/16`)
- First visit stacks orb + headline + subtitle + three promise chips + disclaimer + a three-button dock under a top bar with logo, Get help and Menu. Too many things compete with "start talking".
- Returning: greeting line + "Today feels like haze" + headline + Last time card + dock. The weather line and the card add noise before the person has said anything.
- Desktop Home adds a sidebar (recent list, nav, account) and a right panel (last time, 14-day strip, notes). Far too much for a screen whose only job is "how are you?".

**Conversation** (`phone/04–11`, `desktop/04–12`)
- Writing: status pill + orb + captions + starters + text box + four tool buttons (Style, Breathe, Transcript, Wrap up) + Get help + Back. Voice adds a three-button dock (Mute, Mic, Wrap up) under the tools: seven controls on one screen.
- The status pill ("In conversation", "Ready") tells the person nothing useful.
- Long replies (see the crisis reply, `phone/09`) fill the screen in very large text and push the orb up.
- The four reply styles are a sheet of radio buttons; it feels like a settings form in the middle of a feeling.
- Transcript, Style and Get help each open their own sheet; it's easy to lose your place.

**Card after Wrap up** (`phone/12`, `desktop/13`)
- The card, then "Does this feel right?" with two buttons, then Save image / Read the conversation / Delete, then a sign-in prompt, then "Your say" with Edit and Sky rows, then "What I'll remember" with Forget buttons, then a link. Eight blocks under a card the person just wants to read.
- Edit mode (`phone/13`) turns the card into five stacked form fields.

**Your skies, Patterns, What I remember, Settings, Privacy** (`phone/17–22`, `desktop/18–23`)
- Your skies: a sky line, a legend with counts, an explanation paragraph and a list, all boxed. Desktop: a full month calendar plus a side panel.
- Patterns: on few topics it's two dots and a line on an empty page; on desktop there's also a ranked list in a panel.
- What I remember: a switch card, a summary card, groups of rows with Edit and Forget on every row, Add something, Forget everything.
- Settings and Privacy: long lists of boxed rows.
- Menu: eight items, including pages most people will open once.

## 3. What must stay (hard rules)
Simplify how these look and where they live; don't remove them.

**Safety (non-negotiable)**
- **Get help is one tap away on every screen**, including inside a conversation. It opens the person's region's emergency number first, then crisis lines (call, text, website), with a way to change region. Numbers are never written into the design as 911/988; they come from the region.
- **Acute risk:** a care panel ("You don't have to carry this alone", call/text the main line, "I'm safe right now") opens by itself and never covers the text box; the conversation keeps going.
- **Elevated risk:** a gentle "Support options" button under the reply.
- **Consent before the first conversation:** AI not a clinician; not for emergencies (region number); memory on by default with a switch; words go to an AI provider; "I'm 18 or older" checkbox; Let's begin / Not now.
- A short "AI companion, not a clinician or emergency service" line where people first arrive.

**Conversation**
- Talk and Write are equal choices; switch between them mid-conversation.
- Voice: tap to talk, pause/mute, and interrupt Haven by speaking or tapping. Live words appear while you talk.
- Starters for a blank start (four of them); they go away after the first message.
- Reply style (four options, default "Whatever feels right"). It can stay a choice the person rarely touches.
- Read back the conversation (transcript, copy text).
- Breathe from inside a conversation and come back to it.
- **Wrap up** (this name is agreed) asks: **Wrap up and make my card** / **I'll be back** / **Keep talking**. "I'll be back" leaves it open; Home offers **Pick up**. There is no "End without a card".
- States to design: Haven greeting first; thinking; "Taking a little longer…" with Stop waiting (after 8 seconds); "That didn't send. Your words are still here." with Try again; voice not available, so write instead.

**The card**
- Title, one or two of the person's own words, what Haven noticed, a small next step, topic tags, a sky.
- The person can: say it feels right / not quite; edit any words; change the sky (six skies including Quiet; show Haven's reason, and "chosen by you" after a change); save it as an image; read the conversation; delete it (with "also forget the notes", ticked by default); see and forget the notes Haven took from it, with Undo.
- A guest prompt to sign in and keep cards (only when accounts are switched on).

**Memory, skies, patterns, settings**
- What I remember: on/off switch; a short "In short" summary the person can edit; notes they can edit, forget (with Undo) and add; Forget everything with a confirmation; a plain notice when memory is off.
- Your skies: each conversation's sky over time, and a way back to any conversation or card; open conversations can be picked up.
- Patterns: recurring topics, which conversations they came from, Talk about this, Hide this topic (with a way to show hidden ones).
- Settings: name, region, memory, voice, ambient sound (with Match my sky and a sound choice), export everything, delete everything (typed confirmation), privacy, terms, help. Desktop also has "Start in" (writing or talking) and keyboard shortcuts.
- Sign in by email link ("It works once") and optionally Google; "Accounts are coming soon" when switched off.
- Breathe: three patterns (Calm, Box, Deep), the orb paces the breath, phase and count; vibration on phone, a soft sound on desktop; I'm done.

**Brand and accessibility**
- Keep the Deep lagoon look: the orb, the gradient, Geist, dark only. Simplify within it.
- Use the colour values in `tokens.css`, not the older `lagoon.css`: the top of the gradient was darkened and the muted text lightened so text passes WCAG AA (4.5:1) at the top of the screen.
- Touch targets at least 44 × 44px; a visible focus ring; everything works with reduced motion.
- Desktop keyboard shortcuts exist (N new, Space talk, B breathe, Esc wrap up, 1–4 style). They need a place to be discovered, not a permanent hint line.

## 4. Questions for the designer to answer
1. **Desktop:** does it need a sidebar at all? The client prefers the conversation with nothing around it. If other pages keep navigation, how do they get it without the dashboard feel?
2. **Navigation:** Talk, Your skies, Patterns, What I remember, Settings, Privacy and Help are all top-level today. Which of these really need to be one tap from everywhere?
3. **Conversation controls:** what is the smallest set always visible while talking or writing? Where do the rest live?
4. **Skies and Patterns:** the client likes tracking things in a fun way but isn't sold on weather. Keep skies, simplify them, or propose something lighter? (No change is also fine.)
5. **The card page:** what does the person see first, and what can wait behind one tap?

## 5. What to deliver
- The same format as before: an HTML component with every screen and state, phone first, then desktop (1440px), plus a short README listing tokens, components and anything new.
- **Every screen in section 3**, with these states: first visit and returning Home; consent; conversation (greeting, writing, voice ready, listening, speaking, thinking, slow reply, didn't send, starters, style, transcript, elevated, acute, Get help); Wrap up dialog; card (view, edit, sky, delete); Your skies (with data and empty); Patterns (with data, a topic, empty); What I remember (on, off, empty); Settings; Sign in (form, sent); Privacy; Breathe; menu.
- **Mark anything new** that isn't in this brief, so it can be agreed before it's built.
- Keep copy close to the current words unless simpler; never invent claims about privacy, review or pricing.
