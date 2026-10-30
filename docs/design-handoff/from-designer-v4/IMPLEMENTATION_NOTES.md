# Desktop "calmer pass" (v4): implementation notes

This round changed only the desktop file (`Haven Desktop.dc.html`). `lagoon.css`, `haven-orb.js` and the phone designs are unchanged. It does not answer the simplification brief in `../v4-simplify/BRIEF.md` (no phone redesign, none of its five questions answered).

## Built
- **Desktop Home** has no side panel: orb, greeting, headline, the text box, three starters without outlines, and on return a single "Last time · title · Pick up" link.
- **Sidebar:** no keyboard badge on New conversation, no note count on What I remember, and Recent trimmed to 4.
- **Fewer shortcut hints:** "E" removed from Edit this card, "⌘ Enter to save" removed from the card editor. The shortcuts still work and stay listed in Keyboard shortcuts.

## Not applied, and why
| Design | Built | Why |
| --- | --- | --- |
| Conversation screen with sidebar, panel, header and "End & make card" | The simple conversation screen | The client asked for no sidebars on the conversation screen; Wrap up is the agreed name. |
| Starters cut from 4 to 3 everywhere | 3 on desktop Home only; the conversation keeps all 4 | Not agreed for phone; flagged for the client. |
| What I remember (memory off) with no side panel | Panel kept | Without it there's no way to turn memory back on. |
| "Help me slow down" in the conversation panel | Not used | The conversation panel isn't built; the brief asked for one name for Breathe. |
| Status pill removed from the conversation header | Phone conversation layout unchanged | Part of the larger simplification still to be designed. |
